/**
* This file was @generated using pocketbase-typegen
*/

export enum Collections {
	DocBlocks = "doc_blocks",
	Docs = "docs",
	DocsUsers = "docs_users",
	Invites = "invites",
	Lists = "lists",
	ListsUsers = "lists_users",
	Projects = "projects",
	ProjectsUsers = "projects_users",
	Tasks = "tasks",
	Users = "users",
	UsersConnections = "users_connections",
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

export type DocBlocksRecord<Tproperties = unknown> = {
	type: string
	properties?: null | Tproperties
	doc: RecordIdString
	project: RecordIdString
	parent?: RecordIdString
	path: string
	deleted?: boolean
	file?: string
}

export type DocsRecord = {
	title?: string
	createdBy?: RecordIdString
	project?: RecordIdString
	deleted?: boolean
	excludeFromOverview?: boolean
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
	deleted?: boolean
}

export type InvitesRecord = {
	invited_by?: RecordIdString
	project?: RecordIdString
	doc?: RecordIdString
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
	deleted?: boolean
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
	deleted?: boolean
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

export type UsersConnectionsRecord<Tconnection = unknown> = {
	connection?: null | Tconnection
}

// Response types include system fields and match responses from the PocketBase API
export type DocBlocksResponse<Tproperties = unknown, Texpand = unknown> = Required<DocBlocksRecord<Tproperties>> & BaseSystemFields<Texpand>
export type DocsResponse<Texpand = unknown> = Required<DocsRecord> & BaseSystemFields<Texpand>
export type DocsUsersResponse<Texpand = unknown> = Required<DocsUsersRecord> & BaseSystemFields<Texpand>
export type InvitesResponse<Texpand = unknown> = Required<InvitesRecord> & BaseSystemFields<Texpand>
export type ListsResponse = Required<ListsRecord> & BaseSystemFields
export type ListsUsersResponse<Texpand = unknown> = Required<ListsUsersRecord> & BaseSystemFields<Texpand>
export type ProjectsResponse<Texpand = unknown> = Required<ProjectsRecord> & BaseSystemFields<Texpand>
export type ProjectsUsersResponse<Texpand = unknown> = Required<ProjectsUsersRecord> & BaseSystemFields<Texpand>
export type TasksResponse<Texpand = unknown> = Required<TasksRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>
export type UsersConnectionsResponse<Tconnection = unknown> = Required<UsersConnectionsRecord<Tconnection>> & BaseSystemFields

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	doc_blocks: DocBlocksRecord
	docs: DocsRecord
	docs_users: DocsUsersRecord
	invites: InvitesRecord
	lists: ListsRecord
	lists_users: ListsUsersRecord
	projects: ProjectsRecord
	projects_users: ProjectsUsersRecord
	tasks: TasksRecord
	users: UsersRecord
	users_connections: UsersConnectionsRecord
}

export type CollectionResponses = {
	doc_blocks: DocBlocksResponse
	docs: DocsResponse
	docs_users: DocsUsersResponse
	invites: InvitesResponse
	lists: ListsResponse
	lists_users: ListsUsersResponse
	projects: ProjectsResponse
	projects_users: ProjectsUsersResponse
	tasks: TasksResponse
	users: UsersResponse
	users_connections: UsersConnectionsResponse
}

export interface CollectionSchemas {
  users: Users;
  lists: Lists;
  tasks: Tasks;
  lists_users: Listsusers;
  projects: Projects;
  docs: Projects;
  doc_blocks: Docblocks;
  projects_users: Listsusers;
  docs_users: Listsusers;
  users_connections: Usersconnections;
  invites: Invites;
}

export interface Invites {
  id: string;
  name: string;
  type: string;
  system: boolean;
  schema: Schema8[];
}

export interface Schema8 {
  id: string;
  name: string;
  type: string;
  system: boolean;
  required: boolean;
  options: Options8;
}

export interface Options8 {
  collectionId: string;
  cascadeDelete: boolean;
  minSelect?: any;
  maxSelect: number;
  displayFields: any[];
}

export interface Usersconnections {
  id: string;
  name: string;
  type: string;
  system: boolean;
  schema: Schema7[];
}

export interface Schema7 {
  id: string;
  name: string;
  type: string;
  system: boolean;
  required: boolean;
  options: Options7;
}

export interface Options7 {
}

export interface Docblocks {
  id: string;
  name: string;
  type: string;
  system: boolean;
  schema: Schema6[];
}

export interface Schema6 {
  id: string;
  name: string;
  type: string;
  system: boolean;
  required: boolean;
  options: Options6;
}

export interface Options6 {
  min?: any;
  max?: any;
  pattern?: string;
  collectionId?: string;
  cascadeDelete?: boolean;
  minSelect?: any;
  maxSelect?: number;
  displayFields?: any[];
  maxSize?: number;
  mimeTypes?: any[];
  thumbs?: any[];
  protected?: boolean;
}

export interface Projects {
  id: string;
  name: string;
  type: string;
  system: boolean;
  schema: Schema5[];
}

export interface Schema5 {
  id: string;
  name: string;
  type: string;
  system: boolean;
  required: boolean;
  options: Options5;
}

export interface Options5 {
  min?: any;
  max?: any;
  pattern?: string;
  collectionId?: string;
  cascadeDelete?: boolean;
  minSelect?: any;
  maxSelect?: number;
  displayFields?: any[];
}

export interface Listsusers {
  id: string;
  name: string;
  type: string;
  system: boolean;
  schema: Schema4[];
}

export interface Schema4 {
  id: string;
  name: string;
  type: string;
  system: boolean;
  required: boolean;
  options: Options4;
}

export interface Options4 {
  collectionId?: string;
  cascadeDelete?: boolean;
  minSelect?: any;
  maxSelect?: number;
  displayFields?: any[];
  values?: string[];
}

export interface Tasks {
  id: string;
  name: string;
  type: string;
  system: boolean;
  schema: Schema3[];
}

export interface Schema3 {
  id: string;
  name: string;
  type: string;
  system: boolean;
  required: boolean;
  options: Options3;
}

export interface Options3 {
  min?: string;
  max?: string;
  pattern?: string;
  collectionId?: string;
  cascadeDelete?: boolean;
  minSelect?: any;
  maxSelect?: number;
  displayFields?: any[];
}

export interface Lists {
  id: string;
  name: string;
  type: string;
  system: boolean;
  schema: Schema2[];
}

export interface Schema2 {
  id: string;
  name: string;
  type: string;
  system: boolean;
  required: boolean;
  options: Options2;
}

export interface Options2 {
  min?: any;
  max?: any;
  pattern?: string;
}

export interface Users {
  id: string;
  name: string;
  type: string;
  system: boolean;
  schema: Schema[];
}

export interface Schema {
  id: string;
  name: string;
  type: string;
  system: boolean;
  required: boolean;
  options: Options;
}

export interface Options {
  min?: any;
  max?: any;
  pattern?: string;
  maxSelect?: number;
  maxSize?: number;
  mimeTypes?: string[];
  thumbs?: any;
  protected?: boolean;
  collectionId?: string;
  cascadeDelete?: boolean;
  minSelect?: any;
  displayFields?: any[];
}