/*!
 * jQuery Character Counter v1.0.1 — by Amsul
 * https://github.com/amsul/character-counter
 * 
 * Freely licensed under a Creative Commons Attribution 3.0 Unported License.
 * License: http://creativecommons.org/licenses/by/3.0/
 */


(function($) {

    var CharCounter = function(elem, options) {

        var self = {},
            old_ie = /MSIE\ 7\.0/i.test( navigator.userAgent )


        // return false if it's not a textarea
        if ( old_ie || elem.type !== 'textarea' ) { return false }


        // check the status
        self.keypress = function(e) {

            var selected = ( self.$elem[0].selectionEnd !== self.$elem[0].selectionStart )

            // get the latest values and lengths
            self.update()

            // check if not selected
            if ( !selected ) {

                // if one more character makes length greater than max length
                if ( String.fromCharCode( e.charCode ).length && self._length + 1 > self._maxlength ) {
                    e.preventDefault()
                }
            }

            return self
        }


        // check the paste event
        self.pasteEvent = function(e) {

            var selection = {},
                elem = this

            e.preventDefault()

            // all browsers
            if ( window.getSelection ) {

                selection.selected = window.getSelection().toString()
                selection.start = elem.selectionStart
                selection.end = elem.selectionEnd
                selection.pastedOriginal = ( e.originalEvent.clipboardData ) ? e.originalEvent.clipboardData.getData('text') : window.clipboardData.getData('Text')
            }


            // for IE
            else {

                // get the selection start and end
                selection = ieGetSelection( elem )
                selection.selected = self._value.substr( selection.start, (selection.end - selection.start) )
                selection.pastedOriginal = window.clipboardData.getData('Text')
            }


            // store the text before and after seleection
            selection.startText = elem.value.substr( 0, selection.start )
            selection.endText = elem.value.substr( selection.end )

            // check the characters available to be pasted
            selection.charsRemaining = self.options.maxChars - ( selection.startText.length + selection.endText.length )

            // store the text to be pasted based on chars remaining
            selection.pastedText = selection.pastedOriginal.substr( 0, selection.charsRemaining )


            // if there's no space left, just return it
            if ( !selection.charsRemaining ) {
                return self
            }


            // compose the selection and current value with the pasted text truncated
            self._value = selection.startText + selection.pastedText + selection.endText


            self
                // trim the value so that it updates in the actual textarea
                .trim()

                // set the caret position according to selection
                .setCaret( elem, selection )

                // update and then print the chars left
                .update().print()


            return self
        }


        // set the caret position with cross-browserness
        self.setCaret = function(elem, selection) {

            var caretPosition = selection.start + selection.pastedText.length

            // all browsers
            if ( window.getSelection ) {
                elem.setSelectionRange( caretPosition, caretPosition )
            }

            // for IE
            else {

                // wait a tick for IE to update the value
                setTimeout(function() {
                  ieSetSelection( elem, caretPosition, caretPosition )
                }, 0)
            }

            return self
        }


        // count the characters and print number left
        self.count = function() {

            self
                // get the latest values and lengths
                .update()

                // print the counter
                .print()

            return self
        }


        // update the values and lengths
        self.update = function() {

            self._value = self.$elem.val()
            self._length = self._value.length

            return self
        }


        // trim the value to the maxlength
        self.trim = function() {
            self.$elem[0].value = self._value.substr( 0, self._maxlength )
            return self
        }


        // print the counter
        self.print = function() {

            // the length cannot be greater than the maxlength
            if ( self._maxlength < self._length ) {
                self._length = self._maxlength
            }

            self.$counter[0].innerHTML = self._maxlength - self._length + ' ' + self.options.msgCharsLeft
            return self
        }


        // initialize everything
        self.initialize = (function() {

            // bind the default options
            self.options = $.extend( {}, defaults, options )

            // store the maxlength
            self._maxlength = self.options.maxChars

            // store the elem and create & store the counter box
            self.$elem = $( elem )
            self.$counter = $( '<div class="js-charCounter" />' )

            // do stuff with the $elem
            self.$elem

                // place counter with the $elem append method
                [ self.options.appendMethod ]( self.$counter )

                // bind events
                .on({
                    'keypress':             self.keypress,
                    'input keyup cut':      self.count,
                    'paste':                self.pasteEvent
                })

            return self
        })()


        return self
    },



    /*
        IE get selection from: http://stackoverflow.com/a/4207763
    ======================================================================== */

    ieGetSelection = function(el) {
        var start = 0, end = 0, normalizedValue, range,
            textInputRange, len, endRange;
        if ( typeof el.selectionStart === 'number' && typeof el.selectionEnd === 'number' ) {
            start = el.selectionStart;
            end = el.selectionEnd;
        }
        else {
            range = document.selection.createRange();
            if ( range && range.parentElement() === el ) {
                len = el.value.length;
                normalizedValue = el.value.replace(/\r\n/g, '\n');

                // Create a working TextRange that lives only in the input
                textInputRange = el.createTextRange();
                textInputRange.moveToBookmark(range.getBookmark());

                // Check if the start and end of the selection are at the very end
                // of the input, since moveStart/moveEnd doesn't return what we want
                // in those cases
                endRange = el.createTextRange();
                endRange.collapse(false);

                if (textInputRange.compareEndPoints('StartToEnd', endRange) > -1) {
                    start = end = len;
                } else {
                    start = -textInputRange.moveStart('character', -len);
                    start += normalizedValue.slice(0, start).split('\n').length - 1;

                    if (textInputRange.compareEndPoints('EndToEnd', endRange) > -1) {
                        end = len;
                    } else {
                        end = -textInputRange.moveEnd('character', -len);
                        end += normalizedValue.slice(0, end).split('\n').length - 1;
                    }
                }
            }
        }
        return {
            start: start,
            end: end
        };
    },



    /*
        IE set selection from: http://stackoverflow.com/a/3275506
    ======================================================================== */

    ieSetSelection = function(field, start, end) {

        var range = field.createTextRange()

        // collapse the range
        range.collapse( true )

        // move the selection
        range.moveStart( 'character', start )
        range.moveEnd( 'character', end - start )

        // make the selection
        range.select()
    },



    /*
        Set the plugin defaults
    ======================================================================== */

    defaults = {
        maxChars:           100,
        maxCharsWarning:    80,
        msgCharsLeft:       'characters left',
        msgWarningColor:    '#F00',
        appendMethod:       'after'
    }



    // extend jquery
    $.fn.charCounter = function ( options ) {

        // go through each object passed and return it
        return this.each(function () {

            // check if it hasnt been attached
            if ( !$.data(this, 'charCounting') ) {

                // bind the plugin
                $.data( this, 'charCounting', CharCounter( this, options ) )
            }
        })
    }


})(jQuery);





