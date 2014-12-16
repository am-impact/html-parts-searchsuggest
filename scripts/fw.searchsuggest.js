/**
 * Zoek suggesties tijdens typen
 *  - minder dan 3 karakters: zoeksuggesties leeg en verbergen
 *  - meer dan 3 karakters: met ajax suggesties ophalen en tonen wanneer resultaten
 *  - meer dan 3 karakters als resultaten er al zijn: filteren door de verkregen ajax result
 */
(function() {
    var $form = $('.search__form'),
        $input = $form.find('input[type=text]'),
        $suggest = $('.searchsuggest'),
        $message = $('searchsuggest__message'),
        $loader = $suggest.find('.loader'),
        $suggestButton = $suggest.find('input[type=submit]'),

        suggestsVisible = false,
        suggestsRetrieved = false,

        maxLengthSuggests = 10,
        lengthForSearch = 3,
        searchUrl = FW.Config.submap + 'searchresult/search?search=',
        template = '<li data-search="{{searchstring}}"><a href="{{url}}">{{titel}}</a></li>';

    //
    // Hide suggest
    //
    function hideSuggest() {
        $suggest.find('a:focus').blur();
        $suggest.addClass('visuallyhidden');
        $message.addClass('hidden');
        suggestsVisible = false;
    }

    //
    // Show suggest
    //
    function showSuggest() {
        $suggest.removeClass('visuallyhidden');
        suggestsVisible = true;
    }

    //
    // Suggest leeg gooien
    //
    function emptySuggest() {
        $suggest.find('ul').empty();

        // deze weer op false zetten zodat deze weer opgehaald kunnen worden
        suggestsRetrieved = false;
    }

    //
    // Get suggest
    //
    function getSuggest( searchvalue ) {
        $.getJSON( searchUrl + searchvalue, function( data ) {
            var items = [];

            $loader.addClass('hidden');

            if( data.length > 0 ) {
                $.each( data, function( key, val ) {
                    var tplhtml = template
                                    .replace( /{{searchstring}}/ig, val.searchstring.toLowerCase() )
                                    .replace( /{{url}}/ig, val.url )
                                    .replace( /{{titel}}/ig, val.titel )
                    items.push( tplhtml );
                });

                $('.search__form').find('ul').html( items.join('') );
                showSuggest();

                // Even voor de zekerheid filteren op huidige waarde in zoekveld
                // omdat misschien de bezoeker al heeft doorgetypt terwijl het resultaat nog niet is opgehaald
                filterSuggest( $input.val() );
            }
        }).fail(function() {
            $loader.addClass('hidden');
            $message.removeClass('hidden');

            // Resultaten ontvangen op true zetten
            suggestsRetrieved = false;
        });
    }

    //
    // Filter suggest
    //
    function filterSuggest( searchvalue ) {
            // Eerst spaties uit zoek input filteren
            // Als er bijvoorbeeld gezocht wordt op Voornaam Achternaam, dan wordt ook het juiste resultaat gevonden
        var searchvalue = searchvalue.replace(/\s+/g, ''),
            $matches = $suggest.find('li[data-search*="' + searchvalue.toLowerCase() + '"]'),
            total_matches = $matches.length;

        $suggest.find('li').addClass('visuallyhidden');

        if( total_matches > 0 ) {
            $matches.filter(':lt(' + maxLengthSuggests + ')').removeClass('visuallyhidden');

            if( !$message.hasClass('hidden') ) {
                $message.addClass('hidden');
            }
        }
        else {
            if( $message.hasClass('hidden') && suggestsRetrieved ) {
                $message.removeClass('hidden');
            }
        }

        total_matches > maxLengthSuggests ? $suggestButton.show() : $suggestButton.hide();
    }


    //
    // Focus
    //
    function switchFocus( dir, keyevent ) {

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
                    if( $focused_item.length > 0 && $prev_item.length == 0 ) {
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
                    if( $focused_item.length > 0 && $next_item.length == 0 ) {
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
    // Acties bij typen
    //
    $input.on('keyup', function() {

        var search_input = $(this).val();

        // Value kleiner dan 'lengthForSearch'
        if( search_input.length < lengthForSearch ) {
            // Als de resultaten zichtbaar zijn, dan verbergen
            if( suggestsVisible ) { hideSuggest(); }

            // Als er resultaten zijn, dan deze leeggooien
            if( suggestsRetrieved ) { emptySuggest(); }
        }

        // Value gelijk aan 'lengthForSearch'
        if( search_input.length >= lengthForSearch ) {
            $form.removeClass('search__form--error');

            // Als er al resultaten zijn, bijvoorbeeld na een backspace vanaf lengte 4, dan alleen filteren
            if( suggestsRetrieved ) { filterSuggest( search_input ); }

            // Als er nog geen resultaten zijn, dan deze met ajax ophalen
            if( !suggestsRetrieved ) {
                $loader.removeClass('hidden');
                $message.addClass('hidden');
                showSuggest();

                getSuggest( search_input );

                // Resultaten ontvangen op true zetten
                suggestsRetrieved = true;
            }
        }

        // Value groter dan 'lengthForSearch'
        // Alleen uitvoeren als er daadwerkelijk resultaten uit de ajax call zijn gekomen
        if( search_input.length > lengthForSearch && suggestsRetrieved ) {
            filterSuggest( search_input );

            // Als de resultaten niet zichtbaar zijn, dan deze zichtbaar maken
            if( !suggestsVisible ) { showSuggest(); }
        }
    });

    $suggest.on('click', '.searchsuggest__close', hideSuggest);

    //
    // Escape op keyup uitvoeren omdat de input ook met keyup werkt
    //
    $(document).on('keyup', function(e) {
        switch( e.keyCode ) {
            // Escape
            case 27:
                hideSuggest();
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