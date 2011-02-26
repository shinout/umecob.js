-------------------- file_async start ---------------------
<h1>[%=title%]</h1>

<h2> embed code</h2>
<ul>
[% for(var i in list) {%]
<li>[%=list[i] %]</li>
[%}%]
</ul>

<h2> include umecob</h2>
[%{tpl_id: "examples/node/included.tpl", data_id: "examples/node/included.data", binding: "file"}%]
