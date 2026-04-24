from app.schemas.feature import FeatureBody, Scenario, Step

_STEP_KEYWORDS = ("Given", "When", "Then", "And", "But")


def parse_feature(text: str) -> FeatureBody:
    lines = text.splitlines()
    name = ""
    description_lines: list[str] = []
    scenarios: list[Scenario] = []
    current_scenario: Scenario | None = None
    in_description = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("Feature:"):
            name = stripped[len("Feature:"):].strip()
            in_description = True
            continue

        if stripped.startswith("Scenario:"):
            if in_description:
                in_description = False
            current_scenario = Scenario(
                name=stripped[len("Scenario:"):].strip(),
                steps=[],
            )
            scenarios.append(current_scenario)
            continue

        if in_description:
            if stripped:
                description_lines.append(stripped)
            continue

        if current_scenario is not None:
            for kw in _STEP_KEYWORDS:
                if stripped.startswith(kw + " ") or stripped == kw:
                    step_text = stripped[len(kw):].strip()
                    current_scenario.steps.append(Step(keyword=kw, text=step_text))
                    break

    description = "\n".join(description_lines) if description_lines else None

    return FeatureBody(name=name, description=description, scenarios=scenarios)


def serialize_feature(feature: FeatureBody) -> str:
    lines: list[str] = [f"Feature: {feature.name}"]

    if feature.description:
        for desc_line in feature.description.splitlines():
            lines.append(f"  {desc_line}")

    for scenario in feature.scenarios:
        lines.append("")
        lines.append(f"  Scenario: {scenario.name}")
        for step in scenario.steps:
            lines.append(f"    {step.keyword} {step.text}")

    lines.append("")
    return "\n".join(lines)
