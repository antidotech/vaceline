import { Program } from './program'
import { Expression } from './expression'
import { Statement } from './statement'

import { Location } from './location'

export * from './program'
export * from './statement'
export * from './expression'
export * from './literal'

export * from './location'

export type Node = Program | Statement | Expression
export type PlainNode<N extends Node> = Omit<N, keyof Node>
export type NodeWithLoc<N extends Node = Node> = N & { loc: Location }

export interface BaseNode {
  type: string
  loc?: Location
}

export type NodeType = Node['type']
