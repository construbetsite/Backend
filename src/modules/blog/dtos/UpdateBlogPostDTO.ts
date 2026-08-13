import { CreateBlogPostDTO } from './CreateBlogPostDTO';

// Todos os campos opcionais — somente o que for enviado será atualizado
export type UpdateBlogPostDTO = Partial<CreateBlogPostDTO>;

