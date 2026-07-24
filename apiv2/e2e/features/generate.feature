Feature: Image Generation API
  As a client
  I want to generate a custom cover image
  So that I can use it in my application

  Scenario: Generate image with valid parameters
    When I send a "GET" request to "/api/generateImage" with parameters:
      | width           | 800       |
      | height          | 600       |
      | backgroundColor | #4f46e5   |
      | textColor       | #ffffff   |
      | font            | Montserrat|
      | title           | BDD Image |
    Then the response status code should be 200
    And the response content type should be "image/png"

  Scenario: Validation error with invalid parameters
    When I send a "GET" request to "/api/generateImage" with parameters:
      | width           | -100      |
      | height          | 600       |
      | backgroundColor | #4f46e5   |
      | textColor       | #ffffff   |
      | font            | Montserrat|
      | title           | BDD Image |
    Then the response status code should be 400
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Validation failed"

  Scenario: Validation error with invalid color format
    When I send a "GET" request to "/api/generateImage" with parameters:
      | width           | 800       |
      | height          | 600       |
      | backgroundColor | invalid-color |
      | textColor       | #ffffff   |
      | font            | Montserrat|
      | title           | BDD Image |
    Then the response status code should be 400
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Validation failed"

  Scenario: Validation error with unsupported font
    When I send a "GET" request to "/api/generateImage" with parameters:
      | width           | 800       |
      | height          | 600       |
      | backgroundColor | #4f46e5   |
      | textColor       | #ffffff   |
      | font            | Arial     |
      | title           | BDD Image |
    Then the response status code should be 400
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Validation failed"

  Scenario: Validation error with empty title
    When I send a "GET" request to "/api/generateImage" with parameters:
      | width           | 800       |
      | height          | 600       |
      | backgroundColor | #4f46e5   |
      | textColor       | #ffffff   |
      | font            | Montserrat|
      | title           |           |
    Then the response status code should be 400
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Validation failed"

  Scenario: Validation error with poor color contrast compliance
    When I send a "GET" request to "/api/generateImage" with parameters:
      | width           | 800       |
      | height          | 600       |
      | backgroundColor | #ffffff   |
      | textColor       | #eeeeee   |
      | font            | Montserrat|
      | title           | BDD Image |
    Then the response status code should be 400
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Validation failed"
