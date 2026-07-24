Feature: Metrics Logging API
  As a client
  I want to submit event metrics
  So that they can be stored in the database for tracking

  Scenario: Disallowed method GET returns 405
    When I send a "GET" request to "/api/metrics"
    Then the response status code should be 405
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Method not allowed"

  Scenario: Invalid JSON payload returns 400
    When I send a "POST" request to "/api/metrics" with body:
      """
      invalid-json-content
      """
    Then the response status code should be 400
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Invalid JSON body"

  Scenario: Missing required fields returns 400
    When I send a "POST" request to "/api/metrics" with body:
      """
      {
        "event": "",
        "timestamp": "2026-07-23T12:00:00Z"
      }
      """
    Then the response status code should be 400
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Missing required fields: event, timestamp"

  Scenario: Nil database client returns 500
    Given the database and queue are mock initialized
    When I send a "POST" request to "/api/metrics" with body:
      """
      {
        "event": "test_event",
        "timestamp": "2026-07-23T12:00:00Z"
      }
      """
    Then the response status code should be 500
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Database client not connected"
