import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { Box, Flex, Heading, IconButton, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import React, { useState } from "react";
import {
  PostSnippetFragment,
  useVoteMutation,
  VoteMutation,
} from "../generated/graphql";
import { EditDeletePostButtons } from "./EditDeletePostButtons";
import { ApolloCache, gql } from "@apollo/client";

const updateAfterVote = (
  value: number,
  postId: number,
  cache: ApolloCache<VoteMutation>
) => {
  const data = cache.readFragment<{
    id: number;
    points: number;
    voteStatus: number | null;
  }>({
    id: "Post:" + postId,
    fragment: gql`
      fragment _ on Post {
        id
        points
        voteStatus
      }
    `,
  });
  if (data) {
    if (data.voteStatus === value) {
      return;
    }
    const newPoints =
      (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
    cache.writeFragment({
      id: "Post:" + postId,
      fragment: gql`
        fragment __ on Post {
          points
          voteStatus
        }
      `,
      data: { points: newPoints, voteStatus: value },
    });
  }
};

const PostElement: React.FunctionComponent<PostSnippetFragment> = (post) => {
  const [loadingState, setLoadingState] = useState<
    "updoot-loading" | "downdoot-loading" | "not-loading"
  >("not-loading");
  const [vote] = useVoteMutation();
  return (
    <Flex key={post.id} p={5} shadow="md" borderWidth="1px">
      <Flex
        direction="column"
        justifyContent="center"
        alignItems="center"
        mr={5}
      >
        <IconButton
          onClick={async () => {
            if (post.voteStatus === 1) {
              return;
            }
            setLoadingState("updoot-loading");
            await vote({
              variables: {
                postId: post.id,
                value: 1,
              },
              update: (cache) => updateAfterVote(1, post.id, cache),
            });

            setLoadingState("not-loading");
          }}
          colorScheme={post.voteStatus === 1 ? "green" : undefined}
          isLoading={loadingState === "updoot-loading"}
          aria-label="iconButton"
          icon={<ChevronUpIcon />}
          size="xs"
        />
        {post.points}
        <IconButton
          onClick={async () => {
            if (post.voteStatus === -1) {
              return;
            }
            setLoadingState("downdoot-loading");
            await vote({
              variables: {
                postId: post.id,
                value: -1,
              },
              update: (cache) => updateAfterVote(-1, post.id, cache),
            });
            setLoadingState("not-loading");
          }}
          aria-label="iconButton"
          icon={<ChevronDownIcon />}
          colorScheme={post.voteStatus === -1 ? "red" : undefined}
          isLoading={loadingState === "downdoot-loading"}
          size="xs"
        />
      </Flex>
      <Box flex={1}>
        <NextLink href="/post/[id]" as={`/post/${post.id}`}>
          <Link>
            <Heading fontSize="xl">
              {post.title} [{post.id}]
            </Heading>
          </Link>
        </NextLink>
        <Text>posted by {post.creator.username}</Text>
        <Flex align="center">
          <Text flex={1} mt={4}>
            {post.textSnippet}
          </Text>
          <Box ml="auto">
            <EditDeletePostButtons id={post.id} creatorId={post.creator.id} />
          </Box>
        </Flex>
      </Box>
    </Flex>
  );
};

export default PostElement;
