# ChessKey

Chesskey is a plugin for lichess.org that restricts access to Lichess Games until you have passed a certain number of Puzzle Streak puzzles. After you've passed your goal, you have a ten minute window to play games before the feature is locked out again. Games are unlocked for each additional 5 puzzles you solve past your goal.",

### Requirements
The build requires npm and the following modules:
```npm install -d typescript```
```npm i -D webpack webpack-cli sass style-loader css-loader sass-loader ts-loader html-webpack-plugin webextension-polyfill-ts```

### Build 
```npm run build```