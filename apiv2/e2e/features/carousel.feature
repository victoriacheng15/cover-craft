Feature: LinkedIn Carousel Generation API
  As a client
  I want to submit carousel generation jobs
  So that multi-slide PDF documents and PNG frames can be created asynchronously

  Scenario: Disallowed method GET returns 405
    When I send a "GET" request to "/api/generateCarousel"
    Then the response status code should be 405
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Method not allowed"

  Scenario: Validation error with less than 2 slides
    When I send a "POST" request to "/api/generateCarousel" with body:
      """
      {
        "width": 1080,
        "height": 1080,
        "backgroundColor": "#0F172A",
        "textColor": "#F8FAFC",
        "font": "Montserrat",
        "slides": [
          {
            "title": "Single Slide"
          }
        ]
      }
      """
    Then the response status code should be 400
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Validation failed"

  Scenario: Validation error with poor color contrast
    When I send a "POST" request to "/api/generateCarousel" with body:
      """
      {
        "width": 1080,
        "height": 1080,
        "backgroundColor": "#374151",
        "textColor": "#404040",
        "font": "Montserrat",
        "slides": [
          {
            "title": "Slide 1"
          },
          {
            "title": "Slide 2"
          }
        ]
      }
      """
    Then the response status code should be 400
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Validation failed"

  Scenario: Submit valid carousel generation request
    Given the database and queue are mock initialized
    When I send a "POST" request to "/api/generateCarousel" with body:
      """
      {
        "width": 1080,
        "height": 1080,
        "backgroundColor": "#0F172A",
        "textColor": "#F8FAFC",
        "font": "Montserrat",
        "borderStyle": "single",
        "authorHandle": "@techlead",
        "authorHandlePosition": "bottom-left",
        "showSlideNumbers": true,
        "slideNumberPosition": "top-right",
        "slides": [
          {
            "title": "Slide 1: Overview",
            "subtitle": "High level architecture",
            "textAlign": "left",
            "verticalAlign": "top"
          },
          {
            "title": "Slide 2: Implementation",
            "listItems": ["Step 1", "Step 2"],
            "textAlign": "left",
            "verticalAlign": "top"
          }
        ]
      }
      """
    Then the response status code should be 202
    And the response content type should be "application/json"
    And the response body should contain "message" with value "Carousel job accepted for processing."
    And the response body should contain "jobId"

  Scenario: Query carousel job status
    Given the database contains a job with ID "65f6ba89e0239c7c00000001" and status "completed"
    When I send a "GET" request to "/api/getJobStatus" with parameters:
      | jobId | 65f6ba89e0239c7c00000001 |
    Then the response status code should be 200
    And the response content type should be "application/json"
    And the response body should contain "status" with value "completed"
