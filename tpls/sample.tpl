<table id="tblScene[%=sceneId%]" class="tblStatements">
<thead>
<caption>[%=title%]</caption>
</thead>
<tbody>
<tr class="trStatementHeader">
<th class="cellNo">No.</th>
<th class="cellTag">項目</th>
<th class="cellStatement">文章</th> 
<th class="cellGround">根拠</th> 
<th class="cellReference">参照先</th> 
<th class="cellAction">操作</th></tr>
</tr>
<tr>
<td>
[% {tpl_id: "tpls/test.tpl", data_id: "data/test.json"} %]
[% {tpl_id: "tpls/test.tpl", data: {val: 12} } %]
</td>
[% for (var i in statements) {
echo("<td>"+statements[i]["statement"]+"</td>")
} %]

[% if (title == "シーン") { %]
<td>[%= title%]は[%= sceneId  %]だよね</td>
[% } %]
</tr>
</tbody>
</table>
<div id="shinout">
\[%=sceneId %]のように書くとescapeされるんですわ
そして
[% echo("[% DQおっはー%]")  %]
[% echo('[% SQおっはー%]')  %]
[% echo('ECHOです')  %]
</div>
