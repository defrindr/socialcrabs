export interface ParsedFacebookGroupPost {
  postId: string | null;
  author: string;
  message: string;
}

interface GraphQlMainData {
  data?: {
    node?: {
      group_feed?: {
        edges?: Array<{ node?: Record<string, unknown> }>;
      };
    };
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function getFirstActorName(story: Record<string, unknown> | undefined): string {
  const directActors = story?.actors;
  if (Array.isArray(directActors) && directActors.length > 0) {
    const firstActor = asRecord(directActors[0]);
    const directName = getString(firstActor?.name);
    if (directName) return directName;
  }

  const title = asRecord(story?.title);
  const titleStory = asRecord(title?.story);
  const titleActors = titleStory?.actors;
  if (Array.isArray(titleActors) && titleActors.length > 0) {
    const firstActor = asRecord(titleActors[0]);
    const titleName = getString(firstActor?.name);
    if (titleName) return titleName;
  }

  return '';
}

export function parseFacebookGroupFeedPayload(payload: unknown): ParsedFacebookGroupPost[] {
  if (!payload || typeof payload !== 'object') return [];

  const mainData = payload as GraphQlMainData;
  const posts = mainData?.data?.node?.group_feed?.edges || [];

  return posts.map(({ node: story }) => {
    const storyRecord = asRecord(story);
    const feedback = asRecord(storyRecord?.feedback);
    const owningProfile = asRecord(feedback?.owning_profile);

    const cometSections = asRecord(storyRecord?.comet_sections);
    const content = asRecord(cometSections?.content);
    const contentStory = asRecord(content?.story);

    const directMessage = asRecord(storyRecord?.message);
    const contentMessage = asRecord(contentStory?.message);

    const messageContainer = asRecord(contentStory?.comet_sections);
    const nestedMessageContainer = asRecord(messageContainer?.message_container);
    const nestedMessageStory = asRecord(nestedMessageContainer?.story);
    const nestedMessage = asRecord(nestedMessageStory?.message);

    const formattedSection = asRecord(contentStory?.comet_sections);
    const formattedMessage = asRecord(formattedSection?.message);
    const formattedStory = asRecord(formattedMessage?.story);
    const formattedStoryMessage = asRecord(formattedStory?.message);

    const messageText =
      getString(directMessage?.text) ||
      getString(contentMessage?.text) ||
      getString(nestedMessage?.text) ||
      getString(formattedStoryMessage?.text) ||
      '';

    const postId = getString(storyRecord?.post_id);
    const author = getString(owningProfile?.name) || getFirstActorName(storyRecord) || 'Tanpa Nama';

    return {
      postId: postId || null,
      author,
      message: messageText,
    };
  });
}
