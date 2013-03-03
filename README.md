jQuery-menu-aim
===============

menu-aim is a jQuery plugin for dropdown menus that can differentiate
between a user trying hover over a dropdown item vs trying to navigate into
a submenu's contents.

menu-aim assumes that you have are using a menu with submenus that expand
to the menu's right. It will fire events when the user's mouse enters a new
dropdown item *and* when that item is being intentionally hovered over.

__________________________
| Monkeys  >|   Gorilla  |
| Gorillas >|   Content  |
| Chimps   >|   Here     |
|___________|____________|

In the above example, "Gorillas" is selected and its submenu content is
being shown on the right. Imagine that the user's cursor is hovering over
"Gorillas." When they move their mouse into the "Gorilla Content" area, they
may briefly hover over "Chimps." This shouldn't close the "Gorilla Content"
area.

This problem is normally solved using timeouts and delays. menu-aim tries to
solve this by detecting the direction of the user's mouse movement. This can
make for quicker transitions when navigating up and down the menu. The
experience is hopefully similar to amazon.com/'s "Shop by Department"
dropdown.
