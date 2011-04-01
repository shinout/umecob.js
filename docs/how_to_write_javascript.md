umecob.js API Reference
=======================

## umecob

function umecob(params)
render string from template and data.

@param params object:
    tpl_id  mixed   : Identifier of template. This is parsed by binding. 
                        e.g. If binding is 'file', id means path.
    tpl     string  : Template. If this option is passed, tpl_id is ignored.
                           
    code    string  : JavaScript code compiled from template. 
                        If this option is passed, tpl_id and tpl is ignored.
    data_id mixed   : Identifier of data to pass to the template. This is parsed by binding.
                        e.g. If binding is 'jquery', id means url.
    data    object  : Data to pass to the template. If this option is passed, data_id is ignored.

    attach  mixed   : After 'data' is prepared, this 'attach' is attached to the data (if typeof attach == object).
                        If typeof attach is function, then returned value is merged to 'data'. 
    result  string  : Rendered result. If this option is passed, umecob just returns this value
                        without doing anything.
    umecob function : umecob function in compiler scope. Default: this function.

   ---------------------------------------------------------------------------------------
    These above are modified in umecob() process.                            
    These below are not modified in umecob() process.                            
   ---------------------------------------------------------------------------------------
    preset  string  : Preset name you registered. Default preset is 'plain'.
                        You can register your own preset by calling umecob.preset(name, preset_object) 
    use     mixed   : Use one-time setting. This setting is prior to 'preset' option.

    sync    boolean : If true, calls this function synchronously and returns result.
                       If false, returns Deferred object which passes the result to next function. Default: false
@return if synchronous,    returns (string) result.
        if asynchronous,   returns Deferred object ( next function can get result at first argument)
        if error happened, returns error message(sync), Deferred object (next function gets error message) (async)



