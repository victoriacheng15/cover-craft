Feature: Health Check API
  As a client
  I want to check the health status of the API
  So that I know it is online and functional

  Scenario: Success Health Check
    When I send a "GET" request to "/api/health"
    Then the response status code should be 200
    And the response content type should be "application/json"
    And the response body should contain "data"
