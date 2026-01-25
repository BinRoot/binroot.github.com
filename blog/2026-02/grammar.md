

## Google Home Case Study

Gemini is now on the Google Home, but why does it still feel so limited?

1. "Ok Google, what time is it?"
2. > "It's 3:40pm"
3. "How about in Italy?"
4. > ...
5. "Ok, Google, how about in Italy?"
6. > "Italy is a country in Europe"

I suspect this is a tranditional software "bug" and not exactly the fault of Gemini. 




## Grammar Model

Here's a naive sandwich-making model that appears straightforward at first sight.

```
init: and(spread-pb-on-bread, spread-jelly-on-bread)
spread-pb-on-bread: and(bread, pb)
spread-jelly-on-bread: and(bread, jelly)
```

You get the sample `bread pb bread jelly`. 

Notice how the structure is lost. 

Here's a cool magic trick. Let's make actions like `spread` and `stack` into terminals. 

Samples may look like this `bread pb spread bread jelly spread stack`.

You may argue there is still no structure here; it's just a flat list of words.

The good news is that if we identify "spread" and "stack" as functions, then we can actually represent this sequence of words as a valid Forth program. 

Moreover, a static validator can prove the grammar only produces valid Forth, guaranteeing correctness by construction.

## Learning a Grammar Model

## Closed Loop
