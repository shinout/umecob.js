How to write template?
======================


##1. embed JavaScript Code
###1.1 embed with [% %]

    [% var smartPhones = ["iPhone", "Android"]; %] ( start with '[%' and end with '%]' )


###1.2 of course we can use any JavaScript code

    [% for (var i in smartPhones) { %]
    I want to get [%=smartPhones[i]%]
    [% } %]


###1.3 support multilines

    [% 
    if (Math.random() >= 0.5) {
      console.log("OK!");
    }
    %]


###1.4 embed with other delimiters
    By default, you can choose three types of delimiters.
    1. standard: [%  and  %]
    2. php     : <?  and  ?>  (<?php is not supported. only short open tag)
    3. jsp     : <%  and  %>

    Specify the compiler name as belows.
    umecob.use({compiler: 'jsp'});
      or 
    umecob.preset('hogehoge', {compiler: 'php'});
    umecob({preset: 'hogehoge'});
      or
    umecob({use: {compiler: 'standard'}});


###1.5 change delimiter to your own.
    If you wanna use '<{' and '}>'
    umecob.compiler('asYouLike', Umecob.compiler('<', '{', '}', '>');
    Currently, you cannot change delimiter length ("two" and "two").
    However, if you implement compiler, you can register it with
      umecob.compiler('yourCompilerName', your_compiler_obj);


##2. show variables
###2.1 output with [%= %]

    [% var price = 35000; %]
    [%=price %] (  start with '[% = ' and end with '%]'. No need to add semicolon. )

###2.2 use ${}
    ${hoge} is equal to [%= %]

    <p id="${val.id}">${val.text}</p>

###2.3 output with function "echo"

    [% echo(price + " yen? It's too expensive!"); %] // 35000 yen? It's too expensive!



##3. use passed variables.
###3.1 see sample

Following is a sample data passed to this template.

    {
      val  : "apple",
      arr  : ["ume" ,"cob" , "js", 0.1],
      nest : { "hoge": ["fuga", { hello: "world"}]}
    }

then, you can use these variables as follows.

    [%= val + "  and Microsoft"%] // Apple and Microsoft

    [% for ( var j in arr) { %]
    <p>[%=arr[j] %]</p>
    [% } %]

    [% = nest.hoge[1].hello %] // world


###3.2 use whole data with "echo.data"

echo.data is equal to the passed object.

    [% = echo.data.val %] // Apple


##4. use partial in templates
###4.1 use [% { } %]

    [%{ tpl_id: "/path/to/template", data_id: "/path/to/data" }%] // This code will be converted to the rendered result processed by umecob()

start with '[%{' and end with '}%]'.
You don't need to care if the internal umecob() is synchronous or asynchronous. )


###4.2 call umecob synchronously in [%= %]

    [% = echo.umecob({ tpl_id: "/path/to/template", data_id: "/path/to/data", sync: true }) %] 

    // if you call umecob() synchronously, it returns result processed by umecob() 

By default, echo.umecob() is the same as umecob().
If you call umecob function like 
    umecob({umecob: other_umecob});
Then echo.umecob === other_umecob

###4.3 call umecob Asynchronously in [%@ %]

    [%@ echo.umecob({ tpl_id: "/path/to/template", data_id: "/path/to/data", sync: false}) %] 

    //if you call umecob() asynchronously, 
    //it returns Deferred object. Then use [%@ %] to get a value which the registered next() function returns.


##5. use Deferred Object
see also 4.3

Provide there's a function which returns Deferred object.

    function umecobWrapper() {
      // do something
      return umecob({ tpl_id: "/path/to/template", data_id: "/path/to/data"})
    }

    [%@ umecobWrapper() %]  //This code will converted to the result processed by umecob().



##6. escape [% %]

    \[%= hoge %] // this is not parsed.


##7. reserved variables
"echo" is the only variable reserved in the template parsing scope.


###7.1 use echo()
see 2.2


###7.2 use echo.data
see 3.2

###7.3 use echo.umecob()
see 4.2

###7.4 other echo APIs
There are several methods and properties in "echo",
but they are for internal use and you don't need to know them.

    echo.sync :  (boolean) whether this tempate is parsed synchronously or not.
    echo.defers: (object)
    echo.addDefer: (function)
    echo.addUmecob: (function)
    echo.put: (function)
    echo.getDefers: (function)
    echo.getText: (function)
    echo.getResult: (function)
