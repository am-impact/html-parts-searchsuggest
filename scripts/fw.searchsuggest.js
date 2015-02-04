/**
 * FW.Config.searchUrl: '{{ actionUrl("amSearch/getResults", { template: "zoekresultaat/suggest", sections: "product" })|raw }}'
 * Uit de ajaxrequest komt html: een lijst met li's. In de Craft startup is deze standaard toegevoegd. De plugin amnav is hiervoor nodig
 */
(function() {
    var $search = $('.search'),
        $form = $('.search__form'),
        $input = $form.find('input[type=text]'),
        $suggest = $('.searchsuggest'),
        $message = $('searchsuggest__message'),
        $loader = $suggest.find('.loader'),
        $suggestButton = $suggest.find('input[type=submit]'),
        xhr,

        keyTimeout = 600,
        timeoutInput,

        minLengthQuery = 3,
        searchQuery = '';

    //
    // Suggest leeg gooien
    //
    function emptySuggest() {
        $suggest.find('ul').empty();
    }

    //
    // Get Results
    //
    function getResults( val ) {
        if( xhr && xhr.readyState != 4 ) {
            xhr.abort();
        }

        xhr = $.ajax({
            url: FW.Config.searchUrl,
            data: { 'searchQuery': val }
        }).done(function(data) {
            if( data.html.length < 9 ) {
                $message.removeClass('hidden');
            }
            else {
                $message.addClass('hidden');
            }

            $search.find('ul').html( data.html );
            $suggest.removeClass('visuallyhidden');
            $loader.addClass('hidden');
        });
    }

    //
    // Hide suggest
    //
    function hideSuggest() {
        $suggest.find('a:focus').blur();
        emptySuggest();
        $suggest.addClass('visuallyhidden');
        $message.addClass('hidden');
    }

    //
    // Show suggest
    //
    function showSuggest() {
        if( $suggest.hasClass('visuallyhidden') ) {
            $suggest.removeClass('visuallyhidden');
        }
    }

    //
    // Focus
    //
    function switchFocus( dir, keyevent ) {
        if( $loader.is(':visible') ) return;

        var input_focus_and_suggest_visible = $input.is(':focus') && !$suggest.hasClass('visuallyhidden');

        if( input_focus_and_suggest_visible || $suggest.find('a:focus').length > 0 || $suggestButton.is(':focus') ) {
            var $visible_items = $suggest.find('li:not(.visuallyhidden)'),
                $focused_item = $visible_items.find('a:focus');

            if( keyevent) { keyevent.preventDefault(); }

            switch( dir ) {
                case 'up':
                    // Als focus in zoekveld staat, dan button 'alle' of laatste item
                    if( input_focus_and_suggest_visible ) {
                        if( $suggestButton.is(':visible') ) {
                            $suggestButton.focus();
                        }
                        else {
                            $visible_items.last().find('a').focus();
                        }
                        return;
                    }

                    // Als item focus is, dan vorige item als die er is
                    var $prev_item = $focused_item.parent().prevAll(':not(.visuallyhidden)').first();
                    if( $focused_item.length > 0 && $prev_item.length > 0 ) {
                        $prev_item.find('a').focus();
                        return;
                    }

                    // Eerste item? Dan zoekveld
                    if( $focused_item.length > 0 && $prev_item.length === 0 ) {
                        $input.focus();
                        return;
                    }

                    // Als button is gefocused dan laatste item
                    if( $suggestButton.is(':focus') ) {
                        $visible_items.last().find('a').focus();
                        return;
                    }

                    break;

                case 'down':
                    // Als focus in zoekveld staat, dan eerste item
                    if( input_focus_and_suggest_visible ) {
                        $visible_items.first().find('a').focus();
                        return;
                    }

                    // Als item focus is, dan volgende item als die er is
                    var $next_item = $focused_item.parent().nextAll(':not(.visuallyhidden)').first();
                    if( $focused_item.length > 0 && $next_item.length > 0 ) {
                        $next_item.find('a').focus();
                        return;
                    }

                    // Laatste item? dan 'alle' focussen
                    if( $focused_item.length > 0 && $next_item.length === 0 ) {
                        if( $suggestButton.is(':visible') ) {
                            $suggestButton.focus();
                        }
                        else {
                            $input.focus();
                        }
                        return;
                    }


                    // Als button is gefocusd dan naar zoeken
                    if( $suggestButton.is(':focus') ) {
                        $input.focus();
                        return;
                    }

                    break;
            }
        }
    }

    //
    // Input event
    //
    $input.on('keyup', function(e) {
        if( timeoutInput ) clearTimeout(timeoutInput);

        if( $input.val() == searchQuery ) return;

        searchQuery = $input.val();

        if( searchQuery.length < minLengthQuery ) {
            hideSuggest();
        }
        else {
            showSuggest();
            timeoutInput = setTimeout(function() {
                $loader.removeClass('hidden');
                getResults( searchQuery );
            }, keyTimeout);
        }
    });

    $input.on('focus', function() {
        $input.select();
    });

    $suggest.on('click', '.searchform__close', hideSuggest);

    //
    // Escape op keyup uitvoeren omdat de input ook met keyup werkt
    //
    $(document).on('keyup', function(e) {
        switch( e.keyCode ) {
            // Escape
            case 27:
                hideSuggest();
                $input.select();
                break;
        }
    });

    //
    // Deze bij een keydown uitvoeren,
    // vanwege het event die je kan blokkeren zodat de pagina niet naar onderen scrollt
    // wanneer je op de cursor naar onder drukt
    //
    $(document).on('keydown', function(e) {
        switch( e.keyCode ) {
            // Arrow down
            case 40:
                switchFocus( 'down', e );
                break;
            // Arrow up
            case 38:
                switchFocus( 'up', e );
                break;
            default:
                break;
        }
    });
})();