
export type Annotated<T> = T & { title?: string, description?: string }
export type Declaration<T> = { "$ref": string } | T
