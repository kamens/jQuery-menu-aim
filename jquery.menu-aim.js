/**
 * menu-aim is a jQuery plugin for dropdown menus that can differentiate
 * between a user trying hover over a dropdown item vs trying to navigate into
 * a submenu's contents.
 *
 * menu-aim assumes that you have are using a menu with submenus that expand
 * to the menu's right. It will fire events when the user's mouse enters a new
 * dropdown item *and* when that item is being intentionally hovered over.
 *
 * __________________________
 * | Monkeys  >|   Gorilla  |
 * | Gorillas >|   Content  |
 * | Chimps   >|   Here     |
 * |___________|____________|
 *
 * In the above example, "Gorillas" is selected and its submenu content is
 * being shown on the right. Imagine that the user's cursor is hovering over
 * "Gorillas." When they move their mouse into the "Gorilla Content" area, they
 * may briefly hover over "Chimps." This shouldn't close the "Gorilla Content"
 * area.
 *
 * This problem is normally solved using timeouts and delays. menu-aim tries to
 * solve this by detecting the direction of the user's mouse movement. This can
 * make for quicker transitions when navigating up and down the menu. The
 * experience is hopefully similar to amazon.com/'s "Shop by Department"
 * dropdown.
 *
 * https://github.com/kamens/jQuery-menu-aim
 *
 * STOPSHIP(kamens): x-browser
 * STOPSHIP(kamens): can we remove hoverintent/hoverflow?
*/
(function($) {
	$.fn.menuAim = function(opts) {

        // STOPSHIP
        var $menu = $(this),
            activeRow = null,
            mouseLocs = [],
            lastDelayLoc = null,
            timeoutId = null,
            options = $.extend({
                rowSelector: "> li",
                submenuSelector: "*",
                tolerance: 75,  // STOPSHIP
                enter: $.noop,
                exit: $.noop,
                activate: $.noop,
                deactivate: $.noop
            }, opts);

        var MOUSE_LOCS_TRACKED = 3,  // STOPSHIP
            DELAY = 300;  // STOPSHIP

        /**
         * STOPSHIP
         */
        var mousemove = function(e) {
                mouseLocs.push({x: e.pageX, y: e.pageY});

                if (mouseLocs.length > MOUSE_LOCS_TRACKED) {
                    // STOPSHIP
                    mouseLocs.shift();
                }
            },
            mouseenter = function() {
            },
            mouseleave = function() {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            };

        /**
         * STOPSHIP
         */
        var mouseenterRow = function() {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                options.enter(this);
                possiblyActivate(this);
            },
            mouseleaveRow = function() {
                options.exit(this);
            };

        /**
         * STOPSHIP
         */
        var activate = function(row) {
                if (row == activeRow) {
                    return;
                }

                if (activeRow) {
                    options.deactivate(activeRow);
                }

                options.activate(row);
                activeRow = row;
            },
            possiblyActivate = function(row) {
                var delay = activationDelay();

                if (delay) {
                    timeoutId = setTimeout(function() {
                        possiblyActivate(row)
                    }, delay);
                } else {
                    activate(row);
                }
            },
            activationDelay = function() {
                if (!activeRow || !$(activeRow).is(options.submenuSelector)) {
                    // STOPSHIP
                    return 0;
                }

                var offset = $menu.offset(),
                    upperRight = {
                        x: offset.left + $menu.outerWidth(),
                        y: offset.top - options.tolerance
                    },
                    lowerRight = {
                        x: offset.left + $menu.outerWidth(),
                        y: offset.top + $menu.outerHeight() + options.tolerance
                    },
                    loc = mouseLocs[mouseLocs.length - 1],
                    prevLoc = mouseLocs[0];

                if (!loc) {
                    // STOPSHIP
                    return 0;
                }

                if (!prevLoc) {
                    // STOPSHIP
                    prevLoc = loc;
                }

                if (prevLoc.x < offset.left || prevLoc.x > lowerRight.x ||
                    prevLoc.y < offset.top || prevLoc.y > lowerRight.y) {
                    // STOPSHIP
                    return 0;
                }

                if (lastDelayLoc &&
                        loc.x == lastDelayLoc.x && loc.y == lastDelayLoc.y) {
                    // STOPSHIP
                    return 0;
                }

                // STOPSHIP -- how all this works
                function slope(a, b) {
                    return (b.y - a.y) / (b.x - a.x);
                };

                var upperSlope = slope(loc, upperRight),
                    lowerSlope = slope(loc, lowerRight),
                    prevUpperSlope = slope(prevLoc, upperRight),
                    prevLowerSlope = slope(prevLoc, lowerRight);

                if (upperSlope < prevUpperSlope &&
                        lowerSlope > prevLowerSlope) {
                    // STOPSHIP
                    lastDelayLoc = loc;
                    return DELAY;
                }

                lastDelayLoc = null;
                return 0;
            };

        /**
         * STOPSHIP
         */
        var init = function() {
            $menu
                .mouseenter(mouseenter)
                .mouseleave(mouseleave)
                .find(options.rowSelector)
                    .mouseenter(mouseenterRow)
                    .mouseleave(mouseleaveRow);

            $(document).mousemove(mousemove);
        };

        init();
        return this;
	};
})(jQuery);

