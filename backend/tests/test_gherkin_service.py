from app.schemas.feature import FeatureBody, Scenario, Step
from app.services.gherkin_service import parse_feature, serialize_feature


def test_parse_simple_feature():
    text = """\
Feature: Login

  Scenario: Valid credentials
    Given a registered user
    Then they see the dashboard
"""
    result = parse_feature(text)

    assert result.name == "Login"
    assert len(result.scenarios) == 1
    assert result.scenarios[0].name == "Valid credentials"
    assert len(result.scenarios[0].steps) == 2
    assert result.scenarios[0].steps[0].keyword == "Given"
    assert result.scenarios[0].steps[0].text == "a registered user"
    assert result.scenarios[0].steps[1].keyword == "Then"
    assert result.scenarios[0].steps[1].text == "they see the dashboard"


def test_parse_feature_with_description():
    text = """\
Feature: Authentication
  Handles user login flows
  across multiple providers

  Scenario: Basic login
    Given a user
    Then success
"""
    result = parse_feature(text)

    assert result.name == "Authentication"
    assert result.description == "Handles user login flows\nacross multiple providers"
    assert len(result.scenarios) == 1


def test_parse_multiple_scenarios():
    text = """\
Feature: Cart

  Scenario: Add item
    Given an empty cart
    When an item is added
    Then the cart has one item

  Scenario: Remove item
    Given a cart with one item
    When the item is removed
    Then the cart is empty
"""
    result = parse_feature(text)

    assert len(result.scenarios) == 2
    assert result.scenarios[0].name == "Add item"
    assert len(result.scenarios[0].steps) == 3
    assert result.scenarios[1].name == "Remove item"
    assert len(result.scenarios[1].steps) == 3


def test_parse_all_keywords():
    text = """\
Feature: Keywords

  Scenario: All step types
    Given a precondition
    And another precondition
    When an action occurs
    Then a result happens
    But not something else
"""
    result = parse_feature(text)

    steps = result.scenarios[0].steps
    assert len(steps) == 5
    assert steps[0].keyword == "Given"
    assert steps[1].keyword == "And"
    assert steps[2].keyword == "When"
    assert steps[3].keyword == "Then"
    assert steps[4].keyword == "But"


def test_serialize_feature():
    feature = FeatureBody(
        name="Checkout",
        scenarios=[
            Scenario(
                name="Successful payment",
                steps=[
                    Step(keyword="Given", text="a cart with items"),
                    Step(keyword="When", text="payment is submitted"),
                    Step(keyword="Then", text="order is confirmed"),
                ],
            ),
        ],
    )

    result = serialize_feature(feature)

    expected = """\
Feature: Checkout

  Scenario: Successful payment
    Given a cart with items
    When payment is submitted
    Then order is confirmed
"""
    assert result == expected


def test_serialize_feature_with_description():
    feature = FeatureBody(
        name="Auth",
        description="Login and registration flows",
        scenarios=[
            Scenario(
                name="Login",
                steps=[Step(keyword="Given", text="a user")],
            ),
        ],
    )

    result = serialize_feature(feature)

    expected = """\
Feature: Auth
  Login and registration flows

  Scenario: Login
    Given a user
"""
    assert result == expected


def test_serialize_multiple_scenarios():
    feature = FeatureBody(
        name="Multi",
        scenarios=[
            Scenario(name="First", steps=[Step(keyword="Given", text="a")]),
            Scenario(name="Second", steps=[Step(keyword="Then", text="b")]),
        ],
    )

    result = serialize_feature(feature)

    expected = """\
Feature: Multi

  Scenario: First
    Given a

  Scenario: Second
    Then b
"""
    assert result == expected


def test_round_trip():
    original = """\
Feature: Round trip

  Scenario: First scenario
    Given a precondition
    When an action occurs
    Then a result happens

  Scenario: Second scenario
    Given another setup
    And more setup
    When something happens
    Then outcome
    But not this
"""
    parsed = parse_feature(original)
    serialized = serialize_feature(parsed)

    assert serialized == original


def test_parse_empty_feature():
    text = "Feature: Empty\n"
    result = parse_feature(text)

    assert result.name == "Empty"
    assert result.description is None
    assert result.scenarios == []
