# Neighborhood Map project

## Introduction

Submission for Project #5 in Udacity's Front-end Wed Developer Nanodegree course 

## Project File & Directory Structure

######css/

Contains all required Cascading Style Sheet files

######js/

Contains all required Javascript files and dependencies

######fonts/

Contains all required Fonts used for certain text and icons

######index.html

HTML file for neighbourhood map application

## Running the application

Run local server on the code residing in the project folder and access the website through localhost:8080

  ```bash
  $> cd /path/to/your-project-folder
  $> python -m SimpleHTTPServer 8080
  ```

## Things to note

This application uses the Firebase, Yelp and Foursquare APIs and hence requires API credentials from each platform.

API credential information have been included in the Javascript source for this sample application but this approach should not be used in production environments. Please ensure to remove the API key details from app.js and load them in a more secure manner via environment variables or separate credential files.

## References

The following sites were referenced when working on this project:

* <a href="https://www.firebase.com/docs/web/api/">Firebase Javascript API</a>
* <a href="https://www.yelp.com/developers">Yelp API</a>
* <a href="https://developer.foursquare.com">Foursquare API</a>
* <a href="http://www.onextrapixel.com/2013/06/24/creating-a-swipeable-side-menu-for-the-web">Creating side menu for web</a>
* <a href="https://github.com/bettiolo/oauth-signature-js">Javascript OAuth 1.0a signature generator</a>
* <a href="http://stackoverflow.com/questions/29152676/yelp-api-oauth-invalid-signature-expected-signature-base-string">Stack Overflow: Yelp API OAuth</a>
* <a href="https://scotch.io/quick-tips/default-sizes-for-twitter-bootstraps-media-queries">Default sizes for Bootstrap media queries </a>
