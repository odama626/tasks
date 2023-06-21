/**
* This file was @generated using pocketbase-typegen
*/

export enum Collections {
	Lists = "lists",
	ListsUsers = "lists_users",
	Tasks = "tasks",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

// System fields
export type BaseSystemFields<T = never> = {
	id: RecordIdString
	created: IsoDateString
	updated: IsoDateString
	collectionId: string
	collectionName: Collections
	expand?: T
}

export type AuthSystemFields<T = never> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type ListsRecord = {
	name?: string
	description?: string
}

export enum ListsUsersAccessOptions {
	"admin" = "admin",
	"read" = "read",
	"modify" = "modify",
}
export type ListsUsersRecord = {
	user: RecordIdString
	list: RecordIdString
	access?: ListsUsersAccessOptions
}

export type TasksRecord = {
	name?: string
	body?: string
	createdBy: RecordIdString
	list?: RecordIdString
	completed?: IsoDateString
}

export type UsersRecord = {
	name?: string
	avatar?: string
}

// Response types include system fields and match responses from the PocketBase API
export type ListsResponse = Required<ListsRecord> & BaseSystemFields
export type ListsUsersResponse<Texpand = unknown> = Required<ListsUsersRecord> & BaseSystemFields<Texpand>
export type TasksResponse<Texpand = unknown> = Required<TasksRecord> & BaseSystemFields<Texpand>
export type UsersResponse = Required<UsersRecord> & AuthSystemFields

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	lists: ListsRecord
	lists_users: ListsUsersRecord
	tasks: TasksRecord
	users: UsersRecord
}

export type CollectionResponses = {
	lists: ListsResponse
	lists_users: ListsUsersResponse
	tasks: TasksResponse
	users: UsersResponse
}