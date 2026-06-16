# AGENTS.md

## Communication with the user

* The user is not comfortable reading large amounts of code.
* Explain code changes as concretely as possible.
* Use clear instructions such as:

  * "Replace this part with this code"
  * "Add this code here"
  * "Delete this part"
* Do not give only vague explanations such as "adjust this area" or "fix the handler" without showing the exact target and replacement.
* If a full-file replacement is safer than many small edits, say so clearly and provide the full replacement.

## Change policy

* Avoid repeatedly applying overwrite patches on top of previous patches.
* Avoid fixing issues by adding more and more exception handling as a workaround.
* Check the root cause of the problem and prefer solving it at the source.
* However, if a fix requires broad structural changes or changes across multiple files, do not proceed without first explaining the situation and asking.
* If there are multiple reasonable implementation approaches, explain the options first.
* Compare the advantages and disadvantages of each approach before deciding on a direction.
* Do not rewrite unrelated features without being asked.
* Preserve existing behavior unless the requested change requires otherwise.

## Project overview

* This project is a browser game.
* Multiple users are expected to register their own characters and play.
* Uploaded user files such as images are generally not stored by this system.
* Images and similar assets are expected to be hosted by each user on their own server or an external service, and this system receives and displays the URL.
* Characters have skills and stats.
* The system includes automatic battles based on character skills and stats.
* The system also includes chat features.
* This is a game system with multiple features, including chat, battles, and character management.

## Storage and future deployment assumptions

* Some parts currently use `localStorage` because the project is still in development.
* However, `localStorage` is not the intended production storage method.
* In the future, the project is expected to run on a rented server with a database.
* In production, important data should generally not be stored in `localStorage`.
* Do not assume that loading all data on the client side is acceptable for production.
* Major data such as posts, characters, skills, and battle results should be designed with the assumption that they will eventually be managed on the server side.

## Data retrieval and scale assumptions

* The future amount of data is not yet fixed.
* However, the structure should avoid breaking even if the number of posts or other records grows significantly.
* Avoid designs where the screen loads all data first and then filters it on the client side.
* It is not necessary to implement a server or database immediately.
* However, data retrieval responsibilities should be moved toward the service layer so they can be replaced with API or database-backed implementations later.
* Controllers and views should avoid knowing the details of the storage method whenever possible.

## Working style

* Before making changes, inspect the relevant files.
* Identify which file and which piece of logic is causing the behavior before fixing it.
* For large tasks, provide a short plan first.
* Make changes in small, reviewable steps.
* However, if a structural change is necessary to solve the root cause, explain it and ask before proceeding.
* If test or build commands exist, run only the relevant ones and report the results.
