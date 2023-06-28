/**
* This file was @generated using pocketbase-typegen
*/

export enum Collections {
	DocBlocks = "doc_blocks",
	Docs = "docs",
	DocsUsers = "docs_users",
	Lists = "lists",
	ListsUsers = "lists_users",
	Projects = "projects",
	ProjectsUsers = "projects_users",
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

export type DocBlocksRecord<Tattrs = unknown> = {
	type: string
	attrs?: null | Tattrs
	order?: number
	doc: RecordIdString
	project: RecordIdString
	parent?: RecordIdString
}

export type DocsRecord = {
	title?: string
	createdBy?: RecordIdString
	project?: RecordIdString
}

export enum DocsUsersAccessOptions {
	"admin" = "admin",
	"editor" = "editor",
	"viewer" = "viewer",
}
export type DocsUsersRecord = {
	user: RecordIdString
	doc: RecordIdString
	access?: DocsUsersAccessOptions
}

export type ListsRecord = {
	name?: string
	description?: string
	deleted?: boolean
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
	deleted?: boolean
}

export type ProjectsRecord = {
	name?: string
	createdBy?: RecordIdString
}

export enum ProjectsUsersAccessOptions {
	"admin" = "admin",
	"editor" = "editor",
	"viewer" = "viewer",
}
export type ProjectsUsersRecord = {
	user: RecordIdString
	project: RecordIdString
	access?: ProjectsUsersAccessOptions
}

export type TasksRecord = {
	name?: string
	body?: string
	createdBy: RecordIdString
	list?: RecordIdString
	completed?: IsoDateString
	deleted?: boolean
}

export type UsersRecord = {
	name?: string
	avatar?: string
	lastVisitedList?: RecordIdString
}

// Response types include system fields and match responses from the PocketBase API
export type DocBlocksResponse<Tattrs = unknown, Texpand = unknown> = Required<DocBlocksRecord<Tattrs>> & BaseSystemFields<Texpand>
export type DocsResponse<Texpand = unknown> = Required<DocsRecord> & BaseSystemFields<Texpand>
export type DocsUsersResponse<Texpand = unknown> = Required<DocsUsersRecord> & BaseSystemFields<Texpand>
export type ListsResponse = Required<ListsRecord> & BaseSystemFields
export type ListsUsersResponse<Texpand = unknown> = Required<ListsUsersRecord> & BaseSystemFields<Texpand>
export type ProjectsResponse<Texpand = unknown> = Required<ProjectsRecord> & BaseSystemFields<Texpand>
export type ProjectsUsersResponse<Texpand = unknown> = Required<ProjectsUsersRecord> & BaseSystemFields<Texpand>
export type TasksResponse<Texpand = unknown> = Required<TasksRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	doc_blocks: DocBlocksRecord
	docs: DocsRecord
	docs_users: DocsUsersRecord
	lists: ListsRecord
	lists_users: ListsUsersRecord
	projects: ProjectsRecord
	projects_users: ProjectsUsersRecord
	tasks: TasksRecord
	users: UsersRecord
}

export type CollectionResponses = {
	doc_blocks: DocBlocksResponse
	docs: DocsResponse
	docs_users: DocsUsersResponse
	lists: ListsResponse
	lists_users: ListsUsersResponse
	projects: ProjectsResponse
	projects_users: ProjectsUsersResponse
	tasks: TasksResponse
	users: UsersResponse
}