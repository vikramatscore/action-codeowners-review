import { OwnershipEngine } from './OwnershipEngine';
import fs from 'fs'

export const getOwnership = async (codeowners: string, filePaths: string[]): Promise<string[]> => {
  const engine = OwnershipEngine.FromCodeownersFile(codeowners);

  const owned: string[] = [];

  for (const filePath of filePaths) {
    const owners = engine.calcFileOwnership(filePath);
    owned.push(...owners);
  }

  return owned;
};

export const computeReviewers = async (
    teams: Team[],
    ownersForFileChanges: string[],
    currentReviewersUsers: string[]
): Promise<string[]> => {
    const toAdd: string[] = []
    const toAdd1 = new Set<string>()

    for (const owner of ownersForFileChanges) {
        const matchedTeam = findTeam(teams, owner)
        if (matchedTeam) {
            const randomTeamMember = findRandomTeamMember(matchedTeam)
            if (randomTeamMember && !isAlreadyAReviewer(currentReviewersUsers, randomTeamMember)) {
                toAdd.push(randomTeamMember)
            }
        } else {
          toAdd.push(owner)
        }
      }

    return toAdd
  };

function findTeam(teams: Team[], owner: string) {
    for (const team of teams) {
        if (team.name == owner) {
            return team
        }
    }
    return null
}

function findRandomTeamMember(team: Team) {
    const availableTeamMembers = team.members.filter((member) => {
        !member.ignore
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