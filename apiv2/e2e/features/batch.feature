Feature: Batch Image Generation API
  As a client
  I want to submit a batch of image generation requests
  So that they can be processed asynchronously in the background

  Scenario: Submit valid batch generation request
    Given the database and queue are mock initialized
    When I send a "POST" request to "/api/generateImages" with body:
      """
      [
        {
          "width": 800,
          "height": 600,
          "backgroundColor": "#4f46e5",
          "textColor": "#ffffff",
          "font": "Montserrat",
          "title": "Batch Item 1",
          "filename": "batch1.png"
        }
      ]
      """
    Then the response status code should be 202
    And the response content type should be "application/json"
    And the response body should contain "message" with value "Batch job accepted for processing."
    And the response body should contain "jobId"

  Scenario: Query batch job status
    Given the database contains a job with ID "65f6ba89e0239c7c00000001" and status "completed"
    When I send a "GET" request to "/api/getJobStatus" with parameters:
      | jobId | 65f6ba89e0239c7c00000001 |
    Then the response status code should be 200
    And the response content type should be "application/json"
    And the response body should contain "status" with value "completed"
