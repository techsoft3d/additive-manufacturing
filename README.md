# Additive Manufacturing Completed

A completed version of TechSoft 3D's Additive Manufacturing tutorial for HOOPS Communicator.

More information: https://docs.techsoft3d.com/communicator/latest/build/tutorials-additive-manufacturing-intro.html



## Prerequisites

Verify you have the latest version of `npm` installed on your machine:

`npm --version`

## Install

1. Open a terminal and navigate to tutorial project directory
2. Run `git clone https://bitbucket.org/techsoft3d/additive_manufacturing_completed.git`
3. Run `cd additive_manufacturing_completed`



## Setup and Run


This project has been simplified to run without npm/node.
It can be run using `python3 -m http.server 8080` & accessed at [http://localhost:8080](http://localhost:8080).


The following npm instructions still work.

1. Run `npm install` to install and required Node packages
    * Note: This step must be done at the project root where `package.json` is located
2. Run `npm run build` to build the TypeScript project using [Webpack](https://webpack.js.org/)
3. Run `npm run start` to start a local dev server.
4. Open your browser to [http://localhost:8080](http://localhost:8080) by default
    * Check the console output of step 2 to verify port number
