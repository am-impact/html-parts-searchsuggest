# html-parts-searchsuggest

Uitbreiding op [html startup](https://github.com/am-impact/html-startup)
en [html parts search](https://github.com/am-impact/html-parts-search)

## Bestanden
 * scss/components/_searchsuggest.scss
 * kit/includes/_searchsuggest.kit
 * scripts/fw.searchsuggest.js
 
## Zelf regelen
FW.Config.searchUrl: '{{ actionUrl("amSearch/getResults", { template: "searchresult/search", sections: "product" })|raw }}'

Uit de ajaxrequest komt html: een lijst met li's. In de Craft startup is deze standaard toegevoegd