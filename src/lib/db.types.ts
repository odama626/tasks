/**
* This file was @generated using pocketbase-typegen
*/

export enum Collections {
	DocAttachments = "doc_attachments",
	DocHierarchys = "doc_hierarchys",
	Docs = "docs",
	DocsUsers = "docs_users",
	EntitiesPerUser = "entities_per_user",
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
	createdBy?: RecordIdString
	deleted?: boolean
	doc?: RecordIdString
	file?: string
	name?: string
	size?: number
	type?: string
}

export type DocHierarchysRecord<TdocId = unknown, TparentId = unknown> = {
	docId?: null | TdocId
	parentId?: null | TparentId
}

export type DocsRecord = {
	createdBy?: RecordIdString
	deleted?: boolean
	excludeFromOverview?: boolean
	hideCompletedTasks?: boolean
	parent?: RecordIdString
	project?: RecordIdString
	title?: string
	ydoc?: string
}

export enum DocsUsersAccessOptions {
	"admin" = "admin",
	"editor" = "editor",
	"viewer" = "viewer",
}
export type DocsUsersRecord = {
	access?: DocsUsersAccessOptions
	deleted?: boolean
	doc: RecordIdString
	user: RecordIdString
}

export type EntitiesPerUserRecord = {
	doc_count?: number
	email?: string
	project_count?: number
}

export enum InvitesAccessOptions {
	"admin" = "admin",
	"editor" = "editor",
	"viewer" = "viewer",
}
export type InvitesRecord = {
	access: InvitesAccessOptions
	createdBy?: RecordIdString
	deleted?: boolean
	doc?: RecordIdString
	project?: RecordIdString
	secret: string
}

export type ProjectsRecord = {
	createdBy?: RecordIdString
	deleted?: boolean
	name?: string
}

export enum ProjectsUsersAccessOptions {
	"admin" = "admin",
	"editor" = "editor",
	"viewer" = "viewer",
}
export type ProjectsUsersRecord = {
	access?: ProjectsUsersAccessOptions
	deleted?: boolean
	project: RecordIdString
	user: RecordIdString
}

export type UsersRecord = {
	accentColor?: string
	avatar?: string
	name?: string
	primaryColor?: string
}

export type UsersConnectionsRecord<Tconnection = unknown> = {
	connection?: null | Tconnection
}

// Response types include system fields and match responses from the PocketBase API
export type DocAttachmentsResponse<Texpand = unknown> = Required<DocAttachmentsRecord> & BaseSystemFields<Texpand>
export type DocHierarchysResponse<TdocId = unknown, TparentId = unknown, Texpand = unknown> = Required<DocHierarchysRecord<TdocId, TparentId>> & BaseSystemFields<Texpand>
export type DocsResponse<Texpand = unknown> = Required<DocsRecord> & BaseSystemFields<Texpand>
export type DocsUsersResponse<Texpand = unknown> = Required<DocsUsersRecord> & BaseSystemFields<Texpand>
export type EntitiesPerUserResponse<Texpand = unknown> = Required<EntitiesPerUserRecord> & BaseSystemFields<Texpand>
export type InvitesResponse<Texpand = unknown> = Required<InvitesRecord> & BaseSystemFields<Texpand>
export type ProjectsResponse<Texpand = unknown> = Required<ProjectsRecord> & BaseSystemFields<Texpand>
export type ProjectsUsersResponse<Texpand = unknown> = Required<ProjectsUsersRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>
export type UsersConnectionsResponse<Tconnection = unknown, Texpand = unknown> = Required<UsersConnectionsRecord<Tconnection>> & BaseSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	doc_attachments: DocAttachmentsRecord
	doc_hierarchys: DocHierarchysRecord
	docs: DocsRecord
	docs_users: DocsUsersRecord
	entities_per_user: EntitiesPerUserRecord
	invites: InvitesRecord
	projects: ProjectsRecord
	projects_users: ProjectsUsersRecord
	users: UsersRecord
	users_connections: UsersConnectionsRecord
}

export type CollectionResponses = {
	doc_attachments: DocAttachmentsResponse
	doc_hierarchys: DocHierarchysResponse
	docs: DocsResponse
	docs_users: DocsUsersResponse
	entities_per_user: EntitiesPerUserResponse
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
  invites: Invites;
  doc_attachments: Docattachments;
  doc_hierarchys: Usersconnections;
  entities_per_user: Entitiesperuser;
}

export interface Entitiesperuser {
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
  exceptDomains?: any;
  onlyDomains?: any;
  min?: any;
  max?: any;
  noDecimal?: boolean;
}

export interface Docattachments {
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
  maxSelect?: number;
  maxSize?: number;
  mimeTypes?: any[];
  thumbs?: any[];
  protected?: boolean;
  collectionId?: string;
  cascadeDelete?: boolean;
  minSelect?: any;
  displayFields?: any[];
  min?: any;
  max?: any;
  pattern?: string;
  noDecimal?: boolean;
}

export interface Invites {
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
  collectionId?: string;
  cascadeDelete?: boolean;
  minSelect?: any;
  maxSelect?: number;
  displayFields?: any[];
  values?: string[];
  min?: any;
  max?: any;
  pattern?: string;
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