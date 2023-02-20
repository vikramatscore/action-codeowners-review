import { OwnershipEngine } from './OwnershipEngine';

export const getOwnership = async (codeowners: string, filePaths: string[]): Promise<Set<string>> => {
  const engine = OwnershipEngine.FromCodeownersFile(codeowners);
  const allOwners = new Set<string>();

  for (const filePath of filePaths) {
    const owners = engine.calcFileOwnership(filePath);
    owners.forEach(allOwners.add, allOwners);
  }

  return allOwners;
};

export const computeReviewers = async (
    teams: Team[],
    ownersForFileChanges: Set<string>,
    currentReviewersUsers: string[],
    actor: string
): Promise<Set<string>> => {
    const toAdd = new Set<string>()

    for (const owner of ownersForFileChanges) {
        const matchedTeam = findTeam(teams, owner)
        console.log(`owner: ${owner}, matchedTeam: ${JSON.stringify(matchedTeam)}`)
        if (matchedTeam) {
            const randomTeamMember = findRandomTeamMember(matchedTeam, actor)
            console.log(`randomTeamMember: ${randomTeamMember}`)
            if (randomTeamMember && !isAlreadyAReviewer(currentReviewersUsers, randomTeamMember)) {
                toAdd.add(randomTeamMember)
            }
        } else {
            toAdd.add(owner)
        }
    }

    console.log(`final reviewers: ${JSON.stringify(toAdd)}`)

    return toAdd
  };

function findTeam(teams: Team[], owner: string) {
    for (const team of teams) {
        if (team.name === owner) {
            return team
        }
    }
    return null
}

function findRandomTeamMember(team: Team, actor: string) {
    const availableTeamMembers = team.members.filter((member) => {
        console.log("name check? member.name: " + member.name + ", actor: " + actor + ", checking? " + (member.name !== `@${actor}`))
        return member.name !== `@${actor}` && !member.ignore 
    })
    console.log("available team members: " + JSON.stringify(availableTeamMembers))
    if (availableTeamMembers.length >= 1) {
        return availableTeamMembers[Math.floor(Math.random() * availableTeamMembers.length)].name
    }
    return null
}

function isAlreadyAReviewer(currentReviewersUsers: string[], user: string) {
    const re = /^@/
    const sanitizedUsername = user.replace(re, "")
    console.log(`includes? ${currentReviewersUsers.includes(sanitizedUsername)}`)
    return currentReviewersUsers.includes(sanitizedUsername)
}

export interface TeamMember {
    name: string;
    ignore: boolean;
}

export interface Team {
    name: string;
    members: TeamMember[];
}