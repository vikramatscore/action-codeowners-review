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
    currentReviewersUsers: string[]
): Promise<Set<string>> => {
    const toAdd = new Set<string>()

    for (const owner of ownersForFileChanges) {
        const matchedTeam = findTeam(teams, owner)
        console.log(`owner: ${owner}, matchedTeam: ${JSON.stringify(matchedTeam)}`)
        if (matchedTeam) {
            const randomTeamMember = findRandomTeamMember(matchedTeam)
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

function findRandomTeamMember(team: Team) {
    const availableTeamMembers = team.members.filter((member) => {
        return !member.ignore
    })
    if (availableTeamMembers.length >= 1) {
        return availableTeamMembers[Math.floor(Math.random() * availableTeamMembers.length)].name
    }
    return null
}

function isAlreadyAReviewer(currentReviewersUsers: string[], user: string) {
    return currentReviewersUsers.includes(`@${user}`)
}

export interface TeamMember {
    name: string;
    ignore: boolean;
}

export interface Team {
    name: string;
    members: TeamMember[];
}