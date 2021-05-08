# Fake-Rhythm

This is a discord bot that uses Node.js and hosted on Replit

## Code Folder Structure

The [`commands folder`](https://github.com/Jaston1026/Fake-Rhythm/tree/Development/commands) is where all commands should be stored in a Javascript file.

---

In each `Command Name`.js file should have this snippet of code:
``` js
module.exports = {
  key: "<Command>",
  func: (message, args) => {
    //Command Functions
  }
}
```

---

Here are some illustrations for the above two explanations:

<sup>Command files' export code</sup>

![alt text](https://github.com/Jaston1026/Fake-Rhythm/blob/Development/md-resource/exportCode.png)

<sup>Command files naming</sup>

![alt text](https://github.com/Jaston1026/Fake-Rhythm/blob/Development/md-resource/commandsDir.png)

---
P.S. All `modules` to be used in certain commands are to be declared in its `respective .js file` instead of `index.js`
