## Functions

<dl>
<dt><a href="#probotStatus">probotStatus(checks)</a> ⇒ <code>function</code></dt>
<dd><p>Status Checks as a Probot &quot;app&quot;: call with a map of checks
and get a function that can be passed into Probot&#39;s <code>withApp</code>
function.</p>
</dd>
<dt><a href="#main">main(paramsorfunction, checks)</a> ⇒ <code>object</code> | <code>function</code></dt>
<dd><p>This is the main function</p>
</dd>
</dl>

<a name="probotStatus"></a>

## probotStatus(checks) ⇒ <code>function</code>
Status Checks as a Probot "app": call with a map of checks
and get a function that can be passed into Probot's `withApp`
function.

**Kind**: global function  
**Returns**: <code>function</code> - a probot app function that can be added to any given bot  

| Param | Type | Description |
| --- | --- | --- |
| checks | <code>object</code> | a map of checks to perform. Each key is a name of the check, each value a URL to ping |

<a name="main"></a>

## main(paramsorfunction, checks) ⇒ <code>object</code> \| <code>function</code>
This is the main function

**Kind**: global function  
**Returns**: <code>object</code> \| <code>function</code> - a status report for Pingdom or a wrapped function  

| Param | Type | Description |
| --- | --- | --- |
| paramsorfunction | <code>object</code> \| <code>function</code> | a params object (if called as an OpenWhisk action) or a function to wrap. |
| checks | <code>object</code> | a map of checks to perfom. Each key is a name of the check, each value a URL to ping |

