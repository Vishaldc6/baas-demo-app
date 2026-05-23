# AI Project Context Generator



Analyze this existing project and generate compact AI context files for future feature generation.



## Goal



Help future AI agents understand the existing architecture and implementation patterns so they can generate new features consistently without breaking project conventions.



IMPORTANT:

- Keep outputs compact and implementation-focused.

- Do NOT generate large architecture essays.

- Do NOT over-explain theory.

- Infer architecture ONLY from existing implementation.

- Mention inconsistencies briefly if found.

- Optimize output for future AI-assisted feature generation.



---



# Analyze These Areas



## Project Structure

- folder organization

- module boundaries

- feature architecture

- routing/navigation structure

- shared vs feature-specific code



## State & Data Flow

- Zustand/Redux usage

- React Query usage

- Context usage

- local component state

- auth flow

- API flow

- query/mutation patterns

- cache ownership

- source of truth



## API & Services

- axios/api client setup

- service layer structure

- interceptors

- auth token handling

- response transformation

- error handling patterns



## UI System

- shared component system

- feature-specific components

- typography system

- spacing system

- color system

- styling approach

- NativeWind/Tailwind usage

- reusable UI patterns



## Feature Patterns

- feature folder structure

- screen structure

- hooks patterns

- services patterns

- query integration

- navigation integration

- types organization



## Conventions

- naming conventions

- file naming

- import/export patterns

- dependency boundaries



## Anti-Patterns

- duplicated logic

- inconsistent patterns

- architecture drift

- deprecated approaches



---



# Ignore



Do NOT analyze:

- node_modules

- build folders

- generated files

- platform build code

- lock files
