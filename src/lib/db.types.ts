/**
* This file was @generated using pocketbase-typegen
*/

export enum Collections {
	DocAttachments = "doc_attachments",
	Docs = "docs",
	DocsUsers = "docs_users",
	Invites = "invites",
	Projects = "projects",
	ProjectsUsers = "projects_users",
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

export type DocAttachmentsRecord = {
	file?: string
	doc?: RecordIdString
	createdBy?: RecordIdString
	deleted?: boolean
}

export type DocsRecord = {
	title?: string
	createdBy?: RecordIdString
	project?: RecordIdString
	deleted?: boolean
	excludeFromOverview?: boolean
	ydoc?: string
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

export enum InvitesAccessOptions {
	"admin" = "admin",
	"editor" = "editor",
	"viewer" = "viewer",
}
export type InvitesRecord = {
	createdBy?: RecordIdString
	project?: RecordIdString
	doc?: RecordIdString
	deleted?: boolean
	access: InvitesAccessOptions
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

export type UsersRecord = {
	name?: string
	avatar?: string
}

export type UsersConnectionsRecord<Tconnection = unknown> = {
	connection?: null | Tconnection
}

// Response types include system fields and match responses from the PocketBase API
export type DocAttachmentsResponse<Texpand = unknown> = Required<DocAttachmentsRecord> & BaseSystemFields<Texpand>
export type DocsResponse<Texpand = unknown> = Required<DocsRecord> & BaseSystemFields<Texpand>
export type DocsUsersResponse<Texpand = unknown> = Required<DocsUsersRecord> & BaseSystemFields<Texpand>
export type InvitesResponse<Texpand = unknown> = Required<InvitesRecord> & BaseSystemFields<Texpand>
export type ProjectsResponse<Texpand = unknown> = Required<ProjectsRecord> & BaseSystemFields<Texpand>
export type ProjectsUsersResponse<Texpand = unknown> = Required<ProjectsUsersRecord> & BaseSystemFields<Texpand>
export type UsersResponse = Required<UsersRecord> & AuthSystemFields
export type UsersConnectionsResponse<Tconnection = unknown> = Required<UsersConnectionsRecord<Tconnection>> & BaseSystemFields

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	doc_attachments: DocAttachmentsRecord
	docs: DocsRecord
	docs_users: DocsUsersRecord
	invites: InvitesRecord
	projects: ProjectsRecord
	projects_users: ProjectsUsersRecord
	users: UsersRecord
	users_connections: UsersConnectionsRecord
}

export type CollectionResponses = {
	doc_attachments: DocAttachmentsResponse
	docs: DocsResponse
	docs_users: DocsUsersResponse
	invites: InvitesResponse
	projects: ProjectsResponse
	projects_users: ProjectsUsersResponse
	users: UsersResponse
	users_connections: UsersConnectionsResponse
}

export interface CollectionSchemas {
  users: Users;
  projects: Projects;
  docs: Docs;
  projects_users: Projectsusers;
  docs_users: Projectsusers;
  users_connections: Usersconnections;
  invites: Projectsusers;
  doc_attachments: Docattachments;
}

export interface Docattachments {
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
  maxSelect?: number;
  maxSize?: number;
  mimeTypes?: any[];
  thumbs?: any[];
  protected?: boolean;
  collectionId?: string;
  cascadeDelete?: boolean;
  minSelect?: any;
  displayFields?: any[];
}

export interface Usersconnections {
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
}

export interface Projectsusers {
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

export interface Docs {
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
  collectionId?: string;
  cascadeDelete?: boolean;
  minSelect?: any;
  maxSelect?: number;
  displayFields?: any[];
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
}