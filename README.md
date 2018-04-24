## GNOME Shell Extension Development Utility

>2018-04-24

This extension is a fork of "Gnome Shell Extension Reloader", an
excellent extension by Norman L. Smith you can find [here](https://github.com/nls1729/acme-code/tree/master/extension-reloader).

This extension is intended for use by Gnome Shell Extension writers. It is common practice to restart the Shell during testing to reload an extension with changes made to the extension's code. Wayland does not allow restarting the Shell. To reload an extension under Wayland a logout and a login is required. "Gnome Shell Extension Reloader" reloads only the selected extension with two mouse clicks saving time for the extension writer. **This doesn't work for GS > 3.25**

It also provides an easy access to features such as:

- Reloading GNOME Shell
- Trigger the garbage collector
- Open the extensions folder
- Looking Glass
- GS logs

Available in French and approximative English
