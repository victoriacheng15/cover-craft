Feature: Analytics API
  As a client
  I want to fetch platform analytics reports
  So that I can monitor usage and engagement trends

  Scenario: Disallowed method POST returns 405
    When I send a "POST" request to "/api/analytics"
    Then the response status code should be 405
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Method not allowed"

  Scenario: Nil database client returns 500
    Given the database and queue are mock initialized
    When I send a "GET" request to "/api/analytics"
    Then the response status code should be 500
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Database client not connected"
