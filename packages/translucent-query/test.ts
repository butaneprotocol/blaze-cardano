export interface A {
    f(): boolean
    g(): boolean
}

export interface B {
    g(): boolean
    h(): boolean
}

export interface A2 {
    fg(): boolean
}

export interface B2 {
    gh(): boolean
}

type K = A | B | (A & B)

type Extender<C extends K> = 
    C extends (A & B) ? (A2 & B2) :
    (C extends A ? A2 : B2)

function extend<C extends K>(c: C): Extender<K>{
    let fg: A2["fg"] | undefined
    let gh: B2["gh"] | undefined
    if ('f' in c){
        fg = () => c.f() && c.g()
    }
    if ('h' in c){
        gh = () => c.g() && c.h()
    }
    if (fg && gh){
        return {fg: fg, gh: gh}
    }else if(fg){
        return {fg}
    }else if(gh){
        return {gh}
    }
    throw new Error("extend: unreachable!")
}