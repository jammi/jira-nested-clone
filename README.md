# Jira Issue Nested Cloner

This is a simple tool to clone Jira issues and their subtasks as a tree, including the links between them, reconstructing them in the destination using a similar structure to the original.


## Installation

Use Node version 22 or higher. Then run `npm install`.


## Configuration

Copy the `env.example` file to `.env` and set the variables to match your own project.

There's a script for that: `npm run copy-env`.


## Usage

Go to Jira and select the root issue's ID, such as an Epic with many child-issues with linked dependable issues.

Then either add that to the `.env` like `SOURCE_ISSUE_ID="XX-123"` or into the shell.

Run `npm start` to start the process, or override run-specific parameters like `SOURCE_ISSUE_ID="XX-123" npm start`.

There's also a tool for listing all types in a Jira instance. If the issue isn't set, it simply lists the fields sorted alphabetically, standard ones first, customfields after those, otherwise show field-specific mappings (debug output):
- To run the mapping of fields only, use `SOURCE_ISSUE_ID="" npm run list-fields`.
- To show an issue's fields expanded by description, use `SOURCE_ISSUE_ID="XX-123" npm run list-fields`.


## License
MIT (see LICENSE file)


## Author
Jammi Heinonen <jammi@jammi.pro>


## Contributing
Feel free to contribute by opening an issue or a pull request.


## TODO
As per-needed, in no particular order:
- Prettier output
- More error handling
- Proper test suite
- More configuration options
- More output options
- More input options
- More Jira API's covered for additional types
- More additional tooling
