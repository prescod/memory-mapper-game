"""Executes snippets and reports the memory graph each one builds.

Reads a JSON list of {id, code, names, checks} from stdin and writes a JSON
object mapping each id to {variables, containers, brokenRules}, in the shape of
Snapshot in snapshotJs.ts. Primitives are emitted inline; lists and dicts
become named containers referenced as {"ref": id}, with identity taken from
id().

`checks` holds the identity and call rules of a puzzle (RuntimeChecks in
process.ts). When present, the program must call __dt_checkpoint() between the
starter code and the learner's code, which records the objects the rules name
and replaces the starter functions they mention with recording ones.

This file also runs inside MicroPython in the browser, so it sticks to the
subset both interpreters share.
"""

import json
import sys

MISSING = object()


def is_pet(value):
    # A `Pet` from the hidden prelude, whose class is marked with `_dt_pet`.
    return getattr(type(value), "_dt_pet", False) is True


def is_container(value):
    return isinstance(value, (list, dict)) or is_pet(value)


def resolve(namespace, location):
    if location["root"] not in namespace:
        return MISSING
    value = namespace[location["root"]]
    for step in location["path"]:
        if isinstance(value, list) and isinstance(step, int) and 0 <= step < len(value):
            value = value[step]
        elif isinstance(value, dict) and isinstance(step, str) and step in value:
            value = value[step]
        else:
            return MISSING
    return value


def location_key(location):
    return (location["root"], tuple(location["path"]))


def install_checks(namespace, checks):
    """Hooks the checks into `namespace`; returns a function that lists the broken rule ids."""
    at_start = {}
    recorded = {}

    locations = []
    for rule in checks["identity"]:
        locations.append(rule["a"])
        locations.append(rule["b"])
    for rule in checks["calls"]:
        for location in rule["args"]:
            locations.append(location)

    def spy(name, function):
        def __dt_wrapper(*args, **kwargs):
            recorded[name].append(args)
            return function(*args, **kwargs)

        return __dt_wrapper

    def __dt_checkpoint():
        for location in locations:
            if location["phase"] == "before":
                at_start[location_key(location)] = resolve(namespace, location)
        for rule in checks["calls"]:
            name = rule["fn"]
            if name not in recorded:
                recorded[name] = []
                namespace[name] = spy(name, namespace[name])

    namespace["__dt_checkpoint"] = __dt_checkpoint

    def wanted(location):
        if location["phase"] == "before":
            return at_start.get(location_key(location), MISSING)
        return resolve(namespace, location)

    def broken():
        result = []

        for index, rule in enumerate(checks["identity"]):
            a = wanted(rule["a"])
            b = wanted(rule["b"])
            holds = is_container(a) and is_container(b)
            if holds:
                holds = (a is b) if rule["relation"] == "same" else (a is not b)
            if not holds:
                result.append("identity:" + str(index))

        names = []
        for rule in checks["calls"]:
            if rule["fn"] not in names:
                names.append(rule["fn"])
        for name in names:
            calls = recorded.get(name, [])
            accounted = 0
            for index, rule in enumerate(checks["calls"]):
                if rule["fn"] != name:
                    continue
                targets = [wanted(location) for location in rule["args"]]
                matching = 0
                for args in calls:
                    if len(args) != len(targets):
                        continue
                    same = True
                    for position in range(len(targets)):
                        if not (is_container(targets[position]) and targets[position] is args[position]):
                            same = False
                    if same:
                        matching += 1
                accounted += matching
                if matching != rule["times"]:
                    result.append("call:" + str(index))
            if accounted != len(calls):
                result.append("stray:" + name)

        return result

    return broken


def snapshot(code, names, checks=None):
    namespace = {}
    broken = install_checks(namespace, checks) if checks is not None else None
    exec(code, namespace)
    broken_rules = broken() if broken is not None else None

    ids = {}
    containers = {}

    def encode(value):
        if value is None or isinstance(value, (bool, int, float, str)):
            return value
        if is_pet(value):
            # A `Pet` from the hidden prelude: shown by its name alone, never as
            # a dict, even though it is an instance.
            key = id(value)
            if key in ids:
                return {"ref": ids[key]}
            label = getattr(value, "name", None)
            if not isinstance(label, str):
                raise TypeError(f"Pet name is not a string: {type(label).__name__}")
            container_id = f"c{len(ids)}"
            ids[key] = container_id
            containers[container_id] = {"kind": "pet", "label": label}
            return {"ref": container_id}
        if not isinstance(value, (list, dict)):
            raise TypeError(f"Unsupported value in snapshot: {value!r}")

        key = id(value)
        if key in ids:
            return {"ref": ids[key]}

        container_id = f"c{len(ids)}"
        ids[key] = container_id
        if isinstance(value, list):
            spec = {"kind": "array", "items": []}
            containers[container_id] = spec
            spec["items"] = [encode(item) for item in value]
        else:
            spec = {"kind": "object", "entries": {}}
            containers[container_id] = spec
            for entry_key, item in value.items():
                if not isinstance(entry_key, str):
                    raise TypeError(f"Non-string key in snapshot: {entry_key!r}")
                spec["entries"][entry_key] = encode(item)
        return {"ref": container_id}

    result = {
        "variables": {name: encode(namespace[name]) for name in names},
        "containers": containers,
    }
    if broken_rules is not None:
        result["brokenRules"] = broken_rules
    return result


def main():
    jobs = json.load(sys.stdin)
    results = {job["id"]: snapshot(job["code"], job["names"], job.get("checks")) for job in jobs}
    json.dump(results, sys.stdout)


if __name__ == "__main__":
    main()
