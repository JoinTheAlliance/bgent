import { BgentRuntime } from "../../../../lib/runtime";
import introduce, {
  getRelevantRelationships,
  template,
} from "../../actions/introduce";
import { createRuntime } from "../../../../test/createRuntime";
import {
  describe,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  test,
} from "@jest/globals";
import { UUID } from "crypto";
import { zeroUuid } from "../../../../lib/constants";
import { Session, User } from "@supabase/supabase-js";
import { getRelationship } from "../../../../lib/relationships";
import { State, composeContext } from "../../../../lib";

describe("INTRODUCE Action Tests", () => {
  let runtime: BgentRuntime;
  let session: Session;
  let room_id: UUID;
  // Helper function for user creation or sign-in
  async function ensureUser(email: string, password: string): Promise<User> {
    const {
      data: { user },
      error: signInError,
    } = await runtime.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      const {
        data: { user: newUser },
        error: signUpError,
      } = await runtime.supabase.auth.signUp({ email, password });
      if (signUpError) {
        throw signUpError;
      }
      if (!newUser) throw new Error("User not created");
      return newUser;
    }

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Cleanup function to reset the environment after tests
  async function cleanup(userIds: UUID[]) {
    await Promise.all([
      runtime.messageManager.removeAllMemoriesByUserIds(userIds),
      runtime.descriptionManager.removeAllMemoriesByUserIds(userIds),
    ]);
  }

  beforeAll(async () => {
    ({ session, runtime } = await createRuntime({
      env: process.env,
      actions: [introduce],
    }));

    const data = await getRelationship({
      runtime,
      userA: session.user?.id as UUID,
      userB: zeroUuid,
    });

    room_id = data?.room_id;
  });

  beforeEach(async () => {
    await cleanup([]); // Pass any userIds of users created during tests
  });

  afterAll(async () => {
    await cleanup([]); // Pass any userIds of users created during tests
  });

  test("INTRODUCE is included in actionNames when the user has a description", async () => {
    const user = await ensureUser(
      "user_with_description@example.com",
      "password",
    );
    await runtime.descriptionManager.createMemory({
      user_id: user?.id as UUID,
      user_ids: [user?.id as UUID, zeroUuid],
      content: { content: "Likes indie music" },
      room_id,
    });

    const message = {
      senderId: user?.id as UUID,
      agentId: zeroUuid,
      userIds: [user?.id as UUID, zeroUuid],
      room_id,
      content: {
        content:
          "I'd like to meet someone who enjoys indie music as much as I do.",
      },
    };

    const state = await runtime.composeState(message);
    expect(state.actionNames).toContain("INTRODUCE");
  });

  test("INTRODUCE is not included in actionNames when the user lacks a description", async () => {
    const user = await ensureUser(
      "user_without_description@example.com",
      "password",
    );

    const message = {
      senderId: user.id as UUID,
      agentId: zeroUuid as UUID,
      userIds: [user.id as UUID, zeroUuid],
      room_id,
      content: { content: "I'm new here!" },
    };

    const state = await runtime.composeState(message);
    expect(state.actionNames).not.toContain("INTRODUCE");
  });

  // Additional tests for Rolodex functionality as per the requirements
  describe("Rolodex Functionality", () => {
    let mainUser: User, similarUser: User, differentUser: User;

    beforeAll(async () => {
      // Create main user and add a description
      mainUser = await ensureUser("mainuser@example.com", "password");
      await runtime.descriptionManager.createMemory({
        user_id: mainUser.id as UUID,
        user_ids: [mainUser.id as UUID, zeroUuid],
        content: { content: "Enjoys playing Guitar Hero" },
        room_id: zeroUuid,
      });

      // Create a similar user and add a description
      similarUser = await ensureUser("similaruser@example.com", "password");
      await runtime.descriptionManager.createMemory({
        user_id: similarUser.id as UUID,
        user_ids: [similarUser.id as UUID, zeroUuid],
        content: { content: "Loves music and Guitar Hero" },
        room_id: zeroUuid,
      });

      // Create a different user and add a description
      differentUser = await ensureUser("differentuser@example.com", "password");
      await runtime.descriptionManager.createMemory({
        user_id: differentUser.id as UUID,
        user_ids: [differentUser.id as UUID, zeroUuid],
        content: { content: "Enjoys outdoor activities" },
        room_id: zeroUuid,
      });
    });

    test("Rolodex returns potential connections based on user descriptions", async () => {
      const message = {
        senderId: mainUser.id as UUID,
        agentId: zeroUuid,
        content: {
          content: "Looking to connect with someone with similar interests.",
        },
        room_id,
        userIds: [mainUser.id as UUID, zeroUuid],
      };

      const relevantRelationships = await getRelevantRelationships(
        runtime,
        message,
      );

      expect(relevantRelationships).toContain(similarUser.email); // Assuming the rolodex function lists users by their email or some identifier
      expect(relevantRelationships).not.toContain(differentUser.email);
    });

    test("More similar user is higher in the rolodex list than the less similar user", async () => {
      const message = {
        senderId: mainUser.id as UUID,
        agentId: zeroUuid as UUID,
        content: {
          content: "Who should I meet that enjoys music as much as I do?",
        },
        room_id,
        userIds: [mainUser.id as UUID, zeroUuid],
      };

      const state = (await runtime.composeState(message)) as State;
      const relevantRelationships = await getRelevantRelationships(
        runtime,
        message,
      );
      console.log("***** relevantRelationships");
      console.log(relevantRelationships);

      const context = composeContext({
        state: { ...state, relevantRelationships },
        template,
      });

      const similarUserIndex = relevantRelationships.indexOf(
        similarUser?.email as string,
      );
      const differentUserIndex = relevantRelationships.indexOf(
        differentUser.email as string,
      );

      expect(similarUserIndex).toBeLessThan(differentUserIndex);
      expect(context).toContain(similarUser.email);
    });

    afterEach(async () => {
      await cleanup([
        mainUser.id as UUID,
        similarUser.id as UUID,
        differentUser.id as UUID,
      ]);
    });
  });
});
