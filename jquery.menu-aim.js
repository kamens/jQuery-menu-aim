/**
 * STOPSHIP(kamens)
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
                tolerance: 50,  // STOPSHIP
                enter: $.noop,
                exit: $.noop,
                activate: $.noop,
                deactivate: $.noop
            }, opts);

        var MOUSE_LOCS_TRACKED = 4,  // STOPSHIP
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
                // STOPSHIP remove?
            },
            mouseleave = function() {
                // STOPSHIP remove?
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

