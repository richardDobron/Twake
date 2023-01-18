import{_ as e,c as n,o as a,a as t}from"./app.1ad7488c.js";const m=JSON.parse('{"title":"\u{1F34E} Applications","description":"How applications are managed in Twake backend","frontmatter":{"description":"How applications are managed in Twake backend"},"headers":[],"relativePath":"internal-documentation/backend-services/applications/README.md"}'),i={name:"internal-documentation/backend-services/applications/README.md"},o=t('<h1 id="\u{1F34E}-applications" tabindex="-1">\u{1F34E} Applications <a class="header-anchor" href="#\u{1F34E}-applications" aria-hidden="true">#</a></h1><h4 id="description" tabindex="-1">Description <a class="header-anchor" href="#description" aria-hidden="true">#</a></h4><p><strong>Applications</strong> is everything related to connectors in Twake.</p><p>An application is described by an identity sheet containing this information:</p><ul><li><strong>Identity</strong> (name, description, logo)</li><li><strong>API</strong> <strong>preferences</strong> (Twake\u2192Connector events endpoint, API id and secret, and Connector\u2192Twake allowed IPs)</li><li><strong>Privileges and capabilities</strong> (List of things the connector can read and can write)</li><li><strong>Display information</strong> (Where the connector is visible, button in chat, configuration in application list etc)</li></ul><p>This is all we need to define a connector.</p><p><a href="./database-models.html">database-models</a></p><p><a href="./rest-apis.html">rest-apis</a></p>',8),s=[o];function r(c,p,d,l,h,_){return a(),n("div",null,s)}const f=e(i,[["render",r]]);export{m as __pageData,f as default};