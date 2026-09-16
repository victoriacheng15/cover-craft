Feature: Animated GIF Generation API
  As a client
  I want to generate an animated GIF slideshow
  So that I can present multi-frame cover sequences

  Scenario: Disallowed method GET returns 405
    When I send a "GET" request to "/api/generateGif"
    Then the response status code should be 405
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Method not allowed"

  Scenario: Validation error with less than 2 slides
    When I send a "POST" request to "/api/generateGif" with body:
      """
      {
        "width": 800,
        "height": 600,
        "backgroundColor": "#374151",
        "slides": [
          {
            "title": "Single Slide",
            "font": "Montserrat"
          }
        ]
      }
      """
    Then the response status code should be 400
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Validation failed"

  Scenario: Validation error with poor color contrast on slide
    When I send a "POST" request to "/api/generateGif" with body:
      """
      {
        "width": 800,
        "height": 600,
        "backgroundColor": "#374151",
        "slides": [
          {
            "title": "Slide 1",
            "font": "Montserrat",
            "textColor": "#404040"
          },
          {
            "title": "Slide 2",
            "font": "Roboto"
          }
        ]
      }
      """
    Then the response status code should be 400
    And the response content type should be "application/json"
    And the response body should contain "error" with value "Validation failed"

  Scenario: Generate animated GIF with valid parameters
    When I send a "POST" request to "/api/generateGif" with body:
      """
      {
        "width": 400,
        "height": 300,
        "backgroundColor": "#1e3a8a",
        "delayMs": 1500,
        "slides": [
          {
            "title": "Slide 1",
            "font": "Montserrat",
            "textColor": "#ffffff",
            "hasBorder": true
          },
          {
            "title": "Slide 2",
            "font": "Roboto"
          }
        ]
      }
      """
    Then the response status code should be 200
    And the response content type should be "image/gif"
