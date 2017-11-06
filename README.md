jQuery-menu-aim
===============

Menu-aim is a jQuery plugin for dropdown menus that can differentiate
between a user trying hover over a dropdown item vs trying to navigate into
a submenu's contents. It's originally developed by [kamens](//github.com/kamens/).
You can check out original [project](https://github.com/kamens/jQuery-menu-aim) for reference
and creation history.

[Try a demo.](https://rawgit.com/banesto/jQuery-menu-aim/master/advanced_example/index.html)

Menu-aim tries to solve accidental sibling submenu openings by detecting the direction of
the user's mouse movement. In the image blue triangle represents a possible movement area
for mouse cursor towards submenu edges when submenu will stay open until `defaultDelay` will end.
If mouse cursor moves out of this triange, then sibling submenu will pop up. This can make
for quicker transitions when navigating up and down the menu. The experience is similar to
Amazon's "Shop by Department" dropdown.

![Amazon screenshot](https://raw.github.com/banesto/jQuery-menu-aim/master/amazon.png)

## Use like so:

     $("#menu").menuAim({
         activateCallback: $.noop,    // fired on row activation
         deactivateCallback: $.noop   // fired on row deactivation
     });

You have to create activation and deactivation functions in you own page that could simply
add 'open' class to active submenu like that:

    function activate(row) {
      $(row).addClass('open');
    }

    function deactivate(row) {
      $(row).removeClass('open');
    }

The following options can be passed to menuAim. All functions execute with
the relevant row's HTML element as the execution context ('this'):

    $("#menu").menuAim({
      triggerEvent:       "hover", // A means of activating submenu.
                                   // It's either 'hover' or 'click' or 'both
      rowSelector:        "> li",  // Selector for identifying which elements
                                   // in the menu are rows
      handle:             "> a",   // Handle for triggering mouse clicks on menu item
      submenuSelector:    "*",     // You may have some menu rows that aren't submenus
                                   // and thereforeshouldn't ever need to "activate."
                                   // If so, filter submenu rows w/
                                   // this selector. Defaults to "*" (all elements).
      submenuDirection:   "right", // Direction the submenu opens relative to the
                                   // main menu. Can be left, right, above, or below.
                                   // Defaults to "right".
      openClassName:      "open",  // Class that will be applied to menu item
                                   // when activated

      tolerance:          75,      // Bigger = more tolerant for mouse movement
                                   // precision when entering submenu
      activationDelay:    300,     // Delay (ms) for first submenu opening
      mouseLocsTracked:   3,       // Number of past mouse locations to track direction
      defaultDelay:       300,     // Delay (ms) when user appears to be entering
                                   // submenu and mouse movement is being tracked

      enterCallback:      $.noop,  // Function to call when mouse enters a menu row.
                                   // Entering a row does not mean the row has been
                                   // activated, as the user may be
                                   // mousing over to a submenu.
      activateCallback:   $.noop,  // Function to call when a row is purposefully
                                   // activated. Use this to show a submenu's
                                   // content for the activated row.
      deactivateCallback: $.noop,  // Function to call when a row is deactivated.
      exitCallback:       $.noop,  // Function to call when mouse exits a menu row.
      exitMenuCallback:   $.noop   // Function to call when mouse exits whole menu.
                                   // This is needed for autoclosing submenu
    });

Submenus can be placed in multiple positions relatively to main menu - `left`, `right`, `above` or `below`.
By default menu-aim assumes that you are using a menu with submenus that expand
to the menu's right. It will fire events when the user's mouse enters a new
menu item *and* when that item is being intentionally hovered over.

### Changing submenu open trigger

You can change submenu opening trigger from `hover` to `click`:

    $("#menu").('switchToClick');

And from `click` to `hover`:

    $("#menu").('switchToHover');

## Want an example to learn from?

[Advanced Example](https://rawgit.com/banesto/jQuery-menu-aim/master/advanced_example/index.html) of submenus opening below main menu with ability to switch opening trigger on the fly:

![Advanced example screenshot](https://raw.github.com/banesto/jQuery-menu-aim/master/advanced_example.png)

[Bootstrap example](https://rawgithub.com/banesto/jQuery-menu-aim/master/example/example.html) with menu-aim applied to secondary menu which opens to right:

![Example screenshot](https://raw.github.com/banesto/jQuery-menu-aim/master/example.png)<br>
_Play with the above example full of fun monkey pictures by opening example/example.html after downloading the repo._

## Features

  * UX enhancement for drop-down menus to achieve behavior when moving mouse cursor towards submenu through sibling menu item, current submenu stays open and sibling submenu does not open
  * Ability to set first submenu activation delay - in case menu opening is optional and not crutial and is potentially annoying to users
  * When mouse cursor leaves menu submenu autocloses (if set in 'hover' mode)
  * When in 'click' mode, user can close submenu by clicking outside menu
  * Ability to set whether submenu opens on 'hover' (default) or 'click'
  * Ability to change submenu opening trigger on-the-fly

## Licence

Project lincensed under [MIT](http://en.wikipedia.org/wiki/MIT_License) license.

