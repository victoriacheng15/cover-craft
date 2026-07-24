Feature: Storage Queue Worker Handler
  As the Azure Functions host
  I want to trigger the processJobs function with a queue message payload
  So that batch rendering tasks are processed in the background

  Scenario: Disallowed method GET returns 405
    When I send a "GET" request to "/processJobs"
    Then the response status code should be 405

  Scenario: Missing or invalid JSON body returns 400
    When I send a "POST" request to "/processJobs" with body:
      """
      not-a-json-string
      """
    Then the response status code should be 400

  Scenario: Missing myQueueItem field in payload returns 400
    When I send a "POST" request to "/processJobs" with body:
      """
      {
        "Data": {
          "unrelatedItem": "some-value"
        }
      }
      """
    Then the response status code should be 400

  Scenario: Nil database client returns 500
    Given the database and queue are mock initialized
    When I send a "POST" request to "/processJobs" with body:
      """
      {
        "Data": {
          "myQueueItem": "65f6ba89e0239c7c00000001"
        }
      }
      """
    Then the response status code should be 500
