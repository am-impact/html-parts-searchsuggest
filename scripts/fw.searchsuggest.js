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
        $message = $('.searchsuggest__message'),
        $suggest_button = $suggest.find('input[type=submit]'),
        suggests_visible = false,
        suggests_retrieved = false,
        max_aantal_suggest = 10,
        template = '<li data-search="{{searchstring}}"><a href="{{url}}">{{section}}{{titel}}</a></li>';

    //
    // Hide suggest
    //
    function hideSuggest() {
        $suggest.find('a:focus').blur();
        $suggest.addClass('visuallyhidden');
        $message.addClass('visuallyhidden');
        suggests_visible = false;
    }

    //
    // Show suggest
    //
    function showSuggest() {
        $suggest.removeClass('visuallyhidden');
        suggests_visible = true;
    }

    //
    // Suggest leeg gooien
    //
    function emptySuggest() {
        $suggest.find('ul').empty();

        // deze weer op false zetten zodat deze weer opgehaald kunnen worden
        suggests_retrieved = false;
    }

    //
    // Get suggest
    //
    function getSuggest( searchvalue ) {
        $.getJSON( "searchsuggest.json?search=" + searchvalue, function( data ) {
            var items = [];

            if( data.length > 0 ) {
                $.each( data, function( key, val ) {
                    if(val.sectionhandle != "hoofdmenu") {
                        var tplhtml = template
                                        .replace( /{{searchstring}}/ig, val.searchstring.toLowerCase() )
                                        .replace( /{{url}}/ig, val.url )
                                        .replace( /{{section}}/ig, val.section == '' ? '' : '<span>' + val.section + '</span>' )
                                        .replace( /{{titel}}/ig, val.titel )
                        items.push( tplhtml );
                    }
                });

                $('.search__form').find('ul').html( items.join('') );
                showSuggest();

                // Resultaten ontvangen op true zetten
                suggests_retrieved = true;

                // Even voor de zekerheid filteren op huidige waarde in zoekveld
                // omdat misschien de bezoeker al heeft doorgetypt terwijl het resultaat nog niet is opgehaald
                filterSuggest( $input.val() );
            }
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
            $matches.filter(':lt(' + max_aantal_suggest + ')').removeClass('visuallyhidden');

            if( !$message.hasClass('visuallyhidden') ) {
                $message.addClass('visuallyhidden');
            }
        }
        else {
            if( $message.hasClass('visuallyhidden') ) {
                $message.removeClass('visuallyhidden');
            }
        }

        total_matches > max_aantal_suggest ? $suggest_button.show() : $suggest_button.hide();
    }


    //
    // Focus
    //
    function switchFocus( dir, keyevent ) {

        var input_focus_and_suggest_visible = $input.is(':focus') && !$suggest.hasClass('visuallyhidden');

        if( input_focus_and_suggest_visible || $suggest.find('a:focus').length > 0 || $suggest_button.is(':focus') ) {
            var $visible_items = $suggest.find('li:not(.visuallyhidden)'),
                $focused_item = $visible_items.find('a:focus');

            if( keyevent) { keyevent.preventDefault(); }

            switch( dir ) {
                case 'up':
                    // Als focus in zoekveld staat, dan button 'alle' of laatste item
                    if( input_focus_and_suggest_visible ) {
                        if( $suggest_button.is(':visible') ) {
                            $suggest_button.focus();
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
                    if( $suggest_button.is(':focus') ) {
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
                        if( $suggest_button.is(':visible') ) {
                            $suggest_button.focus();
                        }
                        else {
                            $input.focus();
                        }
                        return;
                    }


                    // Als button is gefocusd dan naar zoeken
                    if( $suggest_button.is(':focus') ) {
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

        // Value kleiner dan 3
        if( search_input.length < 3 ) {
            // Als de resultaten zichtbaar zijn, dan verbergen
            if( suggests_visible ) { hideSuggest(); }

            // Als er resultaten zijn, dan deze leeggooien
            if( suggests_retrieved ) { emptySuggest(); }
        }

        // Value gelijk aan 3
        if( search_input.length >= 3 ) {
            $form.removeClass('search__form--error');

            // Als er al resultaten zijn, bijvoorbeeld na een backspace vanaf lengte 4, dan alleen filteren
            if( suggests_retrieved ) { filterSuggest( search_input ); }

            // Als er nog geen resultaten zijn, dan deze met ajax ophalen
            if( !suggests_retrieved ) {
                getSuggest( search_input );

                // Resultaten ontvangen op true zetten
                suggests_retrieved = true;
            }
        }

        // Value groter dan 3
        // Alleen uitvoeren als er daadwerkelijk resultaten uit de ajax call zijn gekomen
        if( search_input.length > 3 && suggests_retrieved ) {
            filterSuggest( search_input );

            // Als de resultaten niet zichtbaar zijn, dan deze zichtbaar maken
            if( !suggests_visible ) { showSuggest(); }
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