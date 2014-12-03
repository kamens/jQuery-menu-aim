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
 * Use like so:
 *
 *      $("#menu").menuAim({
 *          activate: $.noop,  // fired on row activation
 *          deactivate: $.noop  // fired on row deactivation
 *      });
 *
 *  ...to receive events when a menu's row has been purposefully (de)activated.
 *
 * The following options can be passed to menuAim. All functions execute with
 * the relevant row's HTML element as the execution context ('this'):
 *
 *      .menuAim({
 *          // Function to call when a row is purposefully activated. Use this
 *          // to show a submenu's content for the activated row.
 *          activate: function() {},
 *
 *          // Function to call when a row is deactivated.
 *          deactivate: function() {},
 *
 *          // Function to call when mouse enters a menu row. Entering a row
 *          // does not mean the row has been activated, as the user may be
 *          // mousing over to a submenu.
 *          enter: function() {},
 *
 *          // Function to call when mouse exits a menu row.
 *          exit: function() {},
 *
 *          // Selector for identifying which elements in the menu are rows
 *          // that can trigger the above events. Defaults to "> li".
 *          rowSelector: "> li",
 *
 *          // You may have some menu rows that aren't submenus and therefore
 *          // shouldn't ever need to "activate." If so, filter submenu rows w/
 *          // this selector. Defaults to "*" (all elements).
 *          submenuSelector: "*",
 *
 *          // Direction the submenu opens relative to the main menu. Can be
 *          // left, right, above, or below. Defaults to "right".
 *          submenuDirection: "right"
 *      });
 *
 * https://github.com/kamens/jQuery-menu-aim
*/
(function($) {

    "use strict";

    var MenuAim = function(element, options) {
        this.$menu =
        this.activeRow =
        this.mouseLocs =
        this.lastDelayLoc =
        this.timeoutId =
        this.options = null;

        this.init(element, options);
    };

    MenuAim.DEFAULTS = {
        rowSelector: "> li",
        submenuSelector: "*",
        submenuDirection: "right",
        tolerance: 75,  // bigger = more forgivey when entering submenu
        enter: $.noop,
        exit: $.noop,
        activate: $.noop,
        deactivate: $.noop,
        exitMenu: $.noop
    };

    MenuAim.prototype.getDefaults = function() {
        return MenuAim.DEFAULTS;
    };

    /**
     * Keep track of the last few locations of the mouse.
     */
    MenuAim.prototype.mousemoveDocument = function(e) {
        this.mouseLocs.push({x: e.pageX, y: e.pageY});

        if (this.mouseLocs.length > this.MOUSE_LOCS_TRACKED) {
            this.mouseLocs.shift();
        }
    };

    /**
     * Cancel possible row activations when leaving the menu entirely
     */
    MenuAim.prototype.mouseleaveMenu = function() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        // If exitMenu is supplied and returns true, deactivate the
        // currently active row on menu exit.
        if (this.options.exitMenu(this)) {
            if (this.activeRow) {
                this.options.deactivate(this.activeRow);
            }

            this.activeRow = null;
        }
    };

    /**
     * Trigger a possible row activation whenever entering a new row.
     */
    MenuAim.prototype.mouseenterRow = function(ev) {
        if (this.timeoutId) {
            // Cancel any previous activation delays
            clearTimeout(this.timeoutId);
        }

        this.options.enter(ev.currentTarget);
        this.possiblyActivate(ev.currentTarget);
    };

    MenuAim.prototype.mouseleaveRow = function(ev) {
        this.options.exit(ev.currentTarget);
    };

    /*
     * Immediately activate a row if the user clicks on it.
     */
    MenuAim.prototype.clickRow = function(ev) {
        this.activate(ev.currentTarget);
    };

    /**
     * Activate a menu row.
     */
    MenuAim.prototype.activate = function(row) {
        if (row == this.activeRow) {
            return;
        }

        if (this.activeRow) {
            this.options.deactivate(this.activeRow);
        }

        this.options.activate(row);
        this.activeRow = row;
    };


    /**
     * Possibly activate a menu row. If mouse movement indicates that we
     * shouldn't activate yet because user may be trying to enter
     * a submenu's content, then delay and check again later.
     */
    MenuAim.prototype.possiblyActivate = function(row) {
        var delay = this.activationDelay()
          , self = this;

        if (delay) {
            this.timeoutId = setTimeout(function() {
                self.possiblyActivate(row);
            }, delay);
        } else {
            this.activate(row);
        }
    };

    /**
     * Return the amount of time that should be used as a delay before the
     * currently hovered row is activated.
     *
     * Returns 0 if the activation should happen immediately. Otherwise,
     * returns the number of milliseconds that should be delayed before
     * checking again to see if the row should be activated.
     */
    MenuAim.prototype.activationDelay = function() {
        if (!this.activeRow || !$(this.activeRow).is(this.options.submenuSelector)) {
            // If there is no other submenu row already active, then
            // go ahead and activate immediately.
            return 0;
        }

        var offset = this.$menu.offset(),
            upperLeft = {
                x: offset.left,
                y: offset.top - this.options.tolerance
            },
            upperRight = {
                x: offset.left + this.$menu.outerWidth(),
                y: upperLeft.y
            },
            lowerLeft = {
                x: offset.left,
                y: offset.top + this.$menu.outerHeight() + this.options.tolerance
            },
            lowerRight = {
                x: offset.left + this.$menu.outerWidth(),
                y: lowerLeft.y
            },
            loc = this.mouseLocs[this.mouseLocs.length - 1],
            prevLoc = this.mouseLocs[0];

        if (!loc) {
            return 0;
        }

        if (!prevLoc) {
            prevLoc = loc;
        }

        if (prevLoc.x < offset.left || prevLoc.x > lowerRight.x ||
            prevLoc.y < offset.top || prevLoc.y > lowerRight.y) {
            // If the previous mouse location was outside of the entire
            // menu's bounds, immediately activate.
            return 0;
        }

        if (this.lastDelayLoc &&
                loc.x == this.lastDelayLoc.x && loc.y == this.lastDelayLoc.y) {
            // If the mouse hasn't moved since the last time we checked
            // for activation status, immediately activate.
            return 0;
        }

        // Detect if the user is moving towards the currently activated
        // submenu.
        //
        // If the mouse is heading relatively clearly towards
        // the submenu's content, we should wait and give the user more
        // time before activating a new row. If the mouse is heading
        // elsewhere, we can immediately activate a new row.
        //
        // We detect this by calculating the slope formed between the
        // current mouse location and the upper/lower right points of
        // the menu. We do the same for the previous mouse location.
        // If the current mouse location's slopes are
        // increasing/decreasing appropriately compared to the
        // previous's, we know the user is moving toward the submenu.
        //
        // Note that since the y-axis increases as the cursor moves
        // down the screen, we are looking for the slope between the
        // cursor and the upper right corner to decrease over time, not
        // increase (somewhat counterintuitively).
        function slope(a, b) {
            return (b.y - a.y) / (b.x - a.x);
        }

        var decreasingCorner = upperRight,
            increasingCorner = lowerRight;

        // Our expectations for decreasing or increasing slope values
        // depends on which direction the submenu opens relative to the
        // main menu. By default, if the menu opens on the right, we
        // expect the slope between the cursor and the upper right
        // corner to decrease over time, as explained above. If the
        // submenu opens in a different direction, we change our slope
        // expectations.
        if (this.options.submenuDirection == "left") {
            decreasingCorner = lowerLeft;
            increasingCorner = upperLeft;
        } else if (this.options.submenuDirection == "below") {
            decreasingCorner = lowerRight;
            increasingCorner = lowerLeft;
        } else if (this.options.submenuDirection == "above") {
            decreasingCorner = upperLeft;
            increasingCorner = upperRight;
        }

        var decreasingSlope = slope(loc, decreasingCorner),
            increasingSlope = slope(loc, increasingCorner),
            prevDecreasingSlope = slope(prevLoc, decreasingCorner),
            prevIncreasingSlope = slope(prevLoc, increasingCorner);

        if (decreasingSlope < prevDecreasingSlope &&
                increasingSlope > prevIncreasingSlope) {
            // Mouse is moving from previous location towards the
            // currently activated submenu. Delay before activating a
            // new menu row, because user may be moving into submenu.
            this.lastDelayLoc = loc;
            return this.DELAY;
        }

        this.lastDelayLoc = null;
        return 0;
    };

    MenuAim.prototype.destroy = function() {
        this.$menu.removeData("jquery.menu-aim");

        this.$menu.off(".menu-aim")
            .find(this.options.rowSelector)
            .off(".menu-aim");

        $(document).off(".menu-aim");
    };

    MenuAim.prototype.reset = function(triggerDeactivate) {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        if (this.activeRow && triggerDeactivate) {
            this.options.deactivate(this.activeRow);
        }

        this.activeRow = null;
    };

    MenuAim.prototype.init = function(element, option) {
        this.$menu = $(element);
        this.activeRow = null;
        this.mouseLocs = [];
        this.lastDelayLoc = null;
        this.timeoutId = null;
        this.options = $.extend({}, this.getDefaults(), option);

        this.MOUSE_LOCS_TRACKED = 3;  // number of past mouse locations to track
        this.DELAY = 300;  // ms delay when user appears to be entering submenu

        /**
         * Hook up initial menu events
         */

        this.$menu
            .on("mouseleave.menu-aim", $.proxy(this.mouseleaveMenu, this))
            .find(this.options.rowSelector)
                .on("mouseenter.menu-aim", $.proxy(this.mouseenterRow, this))
                .on("mouseleave.menu-aim", $.proxy(this.mouseleaveRow, this))
                .on("click.menu-aim", $.proxy(this.clickRow, this));

        $(document).on("mousemove.menu-aim", $.proxy(this.mousemoveDocument, this));

    };

    $.fn.menuAim = function(opts) {
        return this.each(function() {
            var $this = $(this)
              , data = $this.data("jquery.menu-aim")
              , options = typeof opts == "object" && opts;

            if (!data) {
                $this.data("jquery.menu-aim", (data = new MenuAim(this, options)));
            }

            if (typeof opts == "string") {
                data[opts]();
            }

        });
    };

})(jQuery);
