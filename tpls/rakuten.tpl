<h1>JSONPの結果</h1>
<p>Status: [%=Header.Status %]</p>
<p>StatusMsg: [%=Header.StatusMsg %]</p>

網一著取得
[% {tpl_id: "tpls/test.tpl", data: {val: Math.PI / 3}, sync: true} %]
